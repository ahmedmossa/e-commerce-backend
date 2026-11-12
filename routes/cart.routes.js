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

const router = express.Router();

router.use(Auth);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items", updateItem);
router.delete("/items/:productId", removeItem);
router.post("/coupon", applyCoupon);
router.delete("/coupon", removeCoupon);
router.delete("/clear", clearCart);

export default router;
