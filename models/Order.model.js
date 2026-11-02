import mongoose from "mongoose";
 
export const OrderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export const PaymentMethods = ["cash", "stripe", "paypal", "paymob"];
export const PaymentStatuses = ["pending", "paid", "failed", "refunded"];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "Quantity must be an integer",
    },
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  postalCode: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: { type: String, enum: PaymentMethods, default: "cash" },
    paymentStatus: { type: String, enum: PaymentStatuses, default: "pending" },
    transactionId: { type: String },

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number },
    tax: { type: Number },
    discount: { type: Number },
    totalPrice: { type: Number, required: true },

    status: { type: String, enum: OrderStatuses, default: "pending" },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    customerNote: { type: String, maxlength: 1000 },
    adminNote: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
