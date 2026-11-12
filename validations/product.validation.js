import { check } from 'express-validator';
import validatorMiddleware from '../middlewares/validator.middleware.js';

// Validate product data before creating a product
export const createProductValidator = [
  check('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  check('shortDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),

  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero'),

  check('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number or zero'),

  check('stock')
    .notEmpty()
    .withMessage('Product stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  check('imageCover')
    .notEmpty()
    .withMessage('Product cover image is required'),

  check('category')
    .notEmpty()
    .withMessage('Product category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),

  check('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid brand ID format'),

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

  check('name')
    .optional()
    .notEmpty()
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be between 3 and 200 characters'),

  check('description')
    .optional()
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  check('shortDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),

  check('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero'),

  check('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number or zero'),

  check('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  check('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),

  check('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid brand ID format'),

  validatorMiddleware,
];

// Validate product ID before deleting it
export const deleteProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  validatorMiddleware,
];