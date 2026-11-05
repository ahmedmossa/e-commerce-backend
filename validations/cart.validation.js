
import Joi from "joi";

const objectId = Joi.string()
  .hex()
  .length(24)
  .messages({
    "string.hex": "Invalid product ID",
    "string.length": "Invalid product ID",
  });

export const addItemSchema = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
  }),
});

export const updateItemSchema = Joi.object({
  productId: objectId.required().messages({
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
  }),
});