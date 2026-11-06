import mongoose from "mongoose";

export const OrderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
export const PaymentMethods = ["cash", "stripe", "paypal", "paymob"];
export const PaymentStatuses = ["pending", "paid", "failed", "refunded"];

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
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
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
});

const orderSchema = new mongoose.Schema({
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

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    status: { type: String, enum: OrderStatuses, default: "pending" },

    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    customerNote: { type: String, maxlength: 1000, trim: true },
    adminNote: { type: String, maxlength: 1000, trim: true },
}, { timestamps: true });

orderSchema.pre("save", function (next) {
    const now = new Date();

    if (this.isModified("status")) {
        if (this.status === "delivered" && !this.deliveredAt) {
            this.deliveredAt = now;
            if (this.paymentMethod === "cash" && this.paymentStatus === "pending") {
                this.paymentStatus = "paid";
                this.paidAt = now;
            }
        } else if (this.status === "cancelled" && !this.cancelledAt) {
            this.cancelledAt = now;
        }
    }

    const expectedTotal = this.subtotal + (this.shippingFee || 0) + (this.tax || 0) - (this.discount || 0);

    if (Math.abs(this.totalPrice - expectedTotal) > 0.01) {
        return next(new Error("Total price does not match the calculated sum"));
    }

    if (this.totalPrice < 0) {
        return next(new Error("Order total cannot be negative"));
    }

    next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
