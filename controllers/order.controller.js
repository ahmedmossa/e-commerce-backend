import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

const FreeShippingThreshold = 1000;
const ShippingFee = 50;
const TaxRate = 0.14;

const round2 = (value) =>
    Math.round(value * 100) / 100;

const buildOrderItems = (cart) =>
    cart.items.map((item) => ({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
    }));

const calculateOrderPrices = (items, discountAmount) => {
    const subtotal = round2(
        items.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        )
    );

    const shippingFee =
        subtotal >= FreeShippingThreshold ? 0 : ShippingFee;

    const tax = round2(subtotal * TaxRate);
    const discount = round2(discountAmount || 0);

    const totalPrice = round2(
        subtotal + shippingFee + tax - discount
    );

    return {
        subtotal,
        shippingFee,
        tax,
        discount,
        totalPrice,
    };
};

export const createOrder = async (req, res, next) => {
    let session;

    try {
        session = await mongoose.startSession();

        const {
            shippingAddress,
            paymentMethod,
            customerNote,
        } = req.validatedBody;

        let order;

        await session.withTransaction(async () => {
            const cart = await Cart.findOne({
                user: req.user._id,
            }).session(session);

            if (!cart || cart.items.length === 0) {
                const error = new Error("Cart is empty");
                error.statusCode = 400;
                throw error;
            }

            const items = buildOrderItems(cart);

            for (const item of items) {
                if (
                    !Number.isInteger(item.quantity) ||
                    item.quantity < 1 ||
                    !Number.isFinite(item.price) ||
                    item.price < 0
                ) {
                    const error = new Error(
                        "Invalid product quantity or price in cart"
                    );
                    error.statusCode = 400;
                    throw error;
                }
            }

            const prices = calculateOrderPrices(
                items,
                cart.discountAmount
            );

            if (
                !Number.isFinite(prices.discount) ||
                prices.discount < 0 ||
                prices.discount > prices.subtotal ||
                prices.totalPrice < 0
            ) {
                const error = new Error(
                    "Invalid order discount or total price"
                );
                error.statusCode = 400;
                throw error;
            }

            for (const item of items) {
                const result = await Product.updateOne(
                    {
                        _id: item.product,
                        isActive: true,
                        stock: {
                            $gte: item.quantity,
                        },
                    },
                    {
                        $inc: {
                            stock: -item.quantity,
                        },
                    },
                    { session }
                );

                if (result.modifiedCount !== 1) {
                    const error = new Error(
                        `Product ${item.name} is unavailable or has insufficient stock`
                    );
                    error.statusCode = 400;
                    throw error;
                }
            }

            const createdOrders = await Order.create(
                [
                    {
                        user: req.user._id,
                        items,
                        shippingAddress,
                        paymentMethod,
                        customerNote,
                        ...prices,
                    },
                ],
                { session }
            );

            order = createdOrders[0];

            cart.items = [];
            cart.coupon = undefined;
            cart.discountAmount = 0;

            await cart.save({ session });
        });

        return res.status(201).json({
            message: "Order created successfully",
            data: order,
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        next(error);

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const page =
            Number(req.validatedQuery.page) || 1;

        const limit =
            Number(req.validatedQuery.limit) || 10;

        const filter = {
            user: req.user._id,
        };

        if (req.validatedQuery.status) {
            filter.status = req.validatedQuery.status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders =
            await Order.countDocuments(filter);

        return res.status(200).json({
            message: "Orders retrieved successfully",
            results: orders.length,
            pagination: {
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                limit,
            },
            data: orders,
        });

    } catch (error) {
        next(error);
    }
};

export const getMyOrderById = async (req, res, next) => {
    try {
        const orderId = req.validatedParams
            ? req.validatedParams.id
            : req.params.id;

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.status(200).json({
            message: "Order retrieved successfully",
            data: order,
        });

    } catch (error) {
        next(error);
    }
};

export const cancelOrder = async (req, res, next) => {
    let session;

    try {
        session = await mongoose.startSession();

        const orderId = req.validatedParams
            ? req.validatedParams.id
            : req.params.id;

        const userId = req.user._id;
        const userRole = req.user.role;

        let cancelledOrder;

        await session.withTransaction(async () => {
            const query = userRole === "admin"
                ? { _id: orderId }
                : {
                    _id: orderId,
                    user: userId,
                };

            const order = await Order.findOne(query)
                .session(session);

            if (!order) {
                const error = new Error("Order not found");
                error.statusCode = 404;
                throw error;
            }

            if (
                !["pending", "confirmed"].includes(order.status)
            ) {
                const error = new Error(
                    `Cannot cancel order. Order status is already '${order.status}'`
                );
                error.statusCode = 400;
                throw error;
            }

            cancelledOrder = await Order.findOneAndUpdate(
                {
                    ...query,
                    status: {
                        $in: ["pending", "confirmed"],
                    },
                },
                {
                    $set: {
                        status: "cancelled",
                        cancelledAt: new Date(),
                    },
                },
                {
                    new: true,
                    session,
                }
            );

            if (!cancelledOrder) {
                const error = new Error(
                    "Order has already been cancelled or cannot be cancelled"
                );
                error.statusCode = 400;
                throw error;
            }

            for (const item of order.items) {
                const result = await Product.updateOne(
                    {
                        _id: item.product,
                    },
                    {
                        $inc: {
                            stock: item.quantity,
                        },
                    },
                    { session }
                );

                if (result.matchedCount !== 1) {
                    throw new Error(
                        `Product ${item.name} was not found`
                    );
                }
            }
        });

        return res.status(200).json({
            message: "Order cancelled successfully and stock restored",
            data: cancelledOrder,
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        next(error);

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

export const confirmOrderPayment = async (req, res, next) => {
    try {
        return res.status(501).json({
            message:
                "Payment verification is not configured yet. Payment cannot be confirmed.",
        });
    } catch (error) {
        next(error);
    }
};
