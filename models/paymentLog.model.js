const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.ObjectId,
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
    },
  },
  { timestamps: true }
);

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);
module.exports = PaymentLog;  