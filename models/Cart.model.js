import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
    coupon: {
      code: { type: String, uppercase: true, trim: true },
      discountType: { type: String, enum: ["percentage", "fixed"] },
      discountValue: { type: Number, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual("discountAmount").get(function () {
  if (!this.coupon || !this.coupon.code) return 0;

  const subtotal = this.subtotal;
  let discount = 0;

  if (this.coupon.discountType === "percentage") {
    discount = (subtotal * this.coupon.discountValue) / 100;
  } else if (this.coupon.discountType === "fixed") {
    discount = this.coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
});

cartSchema.virtual("total").get(function () {
  const total = this.subtotal - this.discountAmount;
  return Math.max(Math.round(total * 100) / 100, 0);
});

cartSchema.virtual("itemCount").get(function () {
  return this.items.reduce((count, item) => count + item.quantity, 0);
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
