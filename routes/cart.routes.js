
import express from "express";

import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyCoupon,
  removeCoupon,
  clearCart,
} from "../controllers/cart.controller.js";

import Auth from "../middlewares/auth.middleware.js";

import {
  addItemValidator,
  updateItemValidator,
  removeItemValidator,
} from "../validations/cart.validation.js";

import {
  applyCouponValidator,
} from "../validations/coupon.validation.js";

const router = express.Router();

router.use(Auth);

router.get("/", getCart);

// Add product to cart
router.post(
  "/items",
  addItemValidator,
  addItem
);

// Update product quantity
router.patch(
  "/items",
  updateItemValidator,
  updateItem
);

// Remove product from cart
router.delete(
  "/items/:productId",
  removeItemValidator,
  removeItem
);

// Apply coupon
router.post(
  "/coupon",
  applyCouponValidator,
  applyCoupon
);

// Remove coupon
router.delete("/coupon", removeCoupon);

// Clear cart
router.delete("/clear", clearCart);

export default router;
