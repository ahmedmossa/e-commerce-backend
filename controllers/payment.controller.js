import Order from '../models/Order.model.js';
import PaymentLog from '../models/paymentLog.model.js';
import stripe from '../config/stripe.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Create or reuse Stripe PaymentIntent
export const createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;

    // 1. Validate orderId
    if (!orderId) {
        return next(new ApiError('Order ID is required', 400));
    }

    // 2. Find order and verify ownership
    const order = await Order.findOne({
        _id: orderId,
        user: req.user._id
    });

    if (!order){
        return next(new ApiError('Order not found', 404));
    }

    // 3. Validate order eligibility
    if (order.status === 'cancelled'){
        return next(new ApiError('Cannot pay for a cancelled order', 400));
    }

    if (order.paymentStatus === 'paid'){
        return next(new ApiError('This order has already been paid', 400));
    }

    if (order.paymentStatus === 'refunded'){
        return next(new ApiError('This order has already been refunded', 400));
    }

    if (order.paymentMethod !== 'stripe'){
        return next(new ApiError('This order does not use Stripe payment', 400));
    }

    // 4. Calculate amount from database
    const amount = Math.round(order.totalPrice * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0){
        return next(new ApiError('Invalid payment amount', 400));
    }

    const currency = 'egp';

    // 5. Find the latest payment attempt
    let latestPaymentLog = await PaymentLog.findOne({ order: order._id }).sort({ createdAt: -1 });
    let paymentIntent = null;
    let createNewIntent = true;

    // 6. Check whether an existing PaymentIntent can be reused
    if (latestPaymentLog){
        paymentIntent = await stripe.paymentIntents.retrieve(
            latestPaymentLog.paymentIntentId
        );

        if (paymentIntent.status === 'succeeded'){
            return next(
                new ApiError('This payment has already succeeded', 409)
            );
        }

        if (paymentIntent.status === 'processing'){
            return next(
                new ApiError('Payment is still processing', 409)
            );
        }

        const isExpired =
            Date.now() - latestPaymentLog.createdAt.getTime() >
            24 * 60 * 60 * 1000;

        const amountChanged = paymentIntent.amount !== amount;

        const canReuse = !['canceled', 'succeeded', 'processing'].includes(paymentIntent.status) && !isExpired && !amountChanged;

        if (canReuse){
            createNewIntent = false;
        } else if (paymentIntent.status !== 'canceled'){
            // Cancel old PaymentIntent before creating a replacement
            try {
                await stripe.paymentIntents.cancel(paymentIntent.id);
            } catch (error){
                return next(
                    new ApiError(
                        'Unable to cancel the existing PaymentIntent',
                        409
                    )
                );
            }
        }
    }

    // 7. Create a new PaymentIntent only when necessary
    if (createNewIntent){
        paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            metadata: {
                orderId: order._id.toString(),
                userId: req.user._id.toString()
            }
        });
    }

    // 8. Create a separate PaymentLog for this attempt
    const paymentLog = await PaymentLog.create({
        user: req.user._id,
        order: order._id,
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        status: 'pending',
        rawResponse: paymentIntent
    });

    // 9. Return payment information
    return res.status(createNewIntent ? 201 : 200).json({
        success: true,
        message: createNewIntent
            ? 'PaymentIntent created successfully'
            : 'Existing PaymentIntent reused successfully',
        data: {
            paymentLogId: paymentLog._id,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
            currency
        }
    });
});


// Handle Stripe Webhook
export const handleStripeWebhook = asyncHandler(async (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret){
        return next(
            new ApiError('Webhook signature or secret is missing', 400)
        );
    }

    // 1. Verify Stripe signature
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            webhookSecret
        );
    } catch (error){
        return next(
            new ApiError('Invalid Stripe webhook signature', 400)
        );
    }

    // 2. Ignore unsupported events
    if (
        ![
            'payment_intent.succeeded',
            'payment_intent.payment_failed'
        ].includes(event.type)
    ) {
        return res.status(200).json({
            received: true,
            message: 'Event ignored'
        });
    }

    const paymentIntent = event.data.object;

    // 3. Prevent processing an event already recorded
    const alreadyProcessed = await PaymentLog.exists({
        $or: [
            { stripeEventId: event.id },
            { processedStripeEventIds: event.id }
        ]
    });

    if (alreadyProcessed){
        return res.status(200).json({
            received: true,
            message: 'Event already processed'
        });
    }

    // 4. Find the latest pending attempt for this PaymentIntent
    const paymentLog = await PaymentLog.findOne({
        paymentIntentId: paymentIntent.id,
        status: 'pending'
    }).sort({ createdAt: -1 });

    if (!paymentLog){
        return next(
            new ApiError('Pending payment attempt not found', 404)
        );
    }

    // 5. Find related order
    const order = await Order.findById(paymentLog.order);

    if (!order){
        return next(new ApiError('Order not found', 404));
    }

    // 6. Handle successful payment
    if (event.type === 'payment_intent.succeeded'){
        paymentLog.status = 'succeeded';
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.transactionId = paymentIntent.id;
    }

    // 7. Handle failed payment
    if (event.type === 'payment_intent.payment_failed'){
        paymentLog.status = 'failed';
        if (order.paymentStatus !== 'paid'){
            order.paymentStatus = 'failed';
        }
    }

    // 8. Save Stripe event information
    paymentLog.stripeEventId = event.id;
    paymentLog.processedStripeEventIds.addToSet(event.id);
    paymentLog.rawResponse = paymentIntent;

    // 9. Save changes
    await order.save();
    await paymentLog.save();

    return res.status(200).json({
        received: true,
        message: 'Webhook processed successfully'
    });
});
