import Joi from "joi";

export const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().alphanum().min(3).max(20).required().messages({
    "any.required": "Coupon code is required",
    "string.empty": "Coupon code is required",
    "string.alphanum": "Coupon code must contain letters and numbers only",
    "string.min": "Coupon code is too short",
    "string.max": "Coupon code is too long",
  }),
});
