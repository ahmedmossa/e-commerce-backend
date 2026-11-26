
import { body, param, validationResult } from "express-validator";
import ApiError from "../utils/apiError.js";

export const validateCartRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new ApiError(
        "Validation failed",
        400,
        errors.array()
      )
    );
  }

  next();
};

const productIdValidator = () =>
  body("productId")
    .isString()
    .withMessage("Product ID must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid product ID")
    .bail()
    .toLowerCase();

const quantityValidator = () =>
  body("quantity")
    .custom((value) => {
      if (
        !["number", "string"].includes(typeof value) ||
        String(value).trim() === "" ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) < 1
      ) {
        throw new Error(
          "Quantity must be a whole number of at least 1"
        );
      }

      return true;
    })
    .customSanitizer((value) => Number(value));

export const addItemValidator = [
  productIdValidator(),

  quantityValidator().optional(),

  validateCartRequest,
];

export const updateItemValidator = [
  productIdValidator(),

  quantityValidator(),

  validateCartRequest,
];

export const removeItemValidator = [
  param("productId")
    .isMongoId()
    .withMessage("Invalid product ID")
    .bail()
    .toLowerCase(),

  validateCartRequest,
];
