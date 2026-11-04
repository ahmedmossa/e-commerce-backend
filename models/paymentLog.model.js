import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Payment amount must be a positive integer.',
     },
   }, 
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'canceled'],
      default: 'pending',
    },
    paymentMethodType: {
      type: String,
    },
    receiptUrl: {
      type: String,
    },
    rawResponse: {
      type: Object,
      default: undefined,
    },
  },
  { timestamps: true }
);

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);
export default PaymentLog; 