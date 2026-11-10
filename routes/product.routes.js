
import express from 'express';

import {
  getProducts,
  getProduct,
} from '../controllers/product.controller.js';

import {
  getProductValidator,
} from '../validations/product.validation.js';

const router = express.Router();

// Get all products
router.get('/', getProducts);

// Get one product by ID
router.get(
  '/:id',
  getProductValidator,
  getProduct
);

export default router;
