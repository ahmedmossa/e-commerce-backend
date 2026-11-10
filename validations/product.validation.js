
import { check } from 'express-validator';

import validatorMiddleware from '../middlewares/validator.middleware.js';

// Validate product data before creating a product
export const createProductValidator = [
  check('title')
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero'),

  check('quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),





  check('imageCover')
    .notEmpty()
    .withMessage('Product cover image is required'),

  check('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),

  validatorMiddleware,
];

// Validate product ID before retrieving it
export const getProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validatorMiddleware,
];

// Validate product ID before updating it
export const updateProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  check('title')
    .optional()
    .notEmpty()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  check('description')
    .optional()
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero'),

  check('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),

  validatorMiddleware,
];

// Validate product ID before deleting it
export const deleteProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validatorMiddleware,
];
