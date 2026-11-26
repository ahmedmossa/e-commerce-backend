
import { body } from "express-validator";
import { validateCartRequest } from "./cart.validation.js";

export const applyCouponValidator = [
  body("code")
    .isString()
    .withMessage("Coupon code must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Coupon code is required")
    .bail()
    .isAlphanumeric()
    .withMessage(
      "Coupon code must contain letters and numbers only"
    )
    .bail()
    .isLength({ min: 3, max: 20 })
    .withMessage(
      "Coupon code must be between 3 and 20 characters"
    )
    .bail()
    .toUpperCase(),

  validateCartRequest,
];
