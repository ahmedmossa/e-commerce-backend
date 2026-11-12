import express from 'express';

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';

import {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} from '../validations/product.validation.js';

import { protect, allowedTo } from '../middlewares/auth.middleware.js';
import { uploadMixOfImages } from '../middlewares/upload.middleware.js';
import reviewRouter from './review.routes.js';

const router = express.Router();

// Mount Review Routes (Nested Route)
router.use('/:productId/reviews', reviewRouter);

// Public Routes
// GET /api/v1/products
router.get('/', getProducts);

// GET /api/v1/products/:id
router.get('/:id', getProductValidator, getProduct);

// Protected Admin Routes for Products (Create, Update, Delete)
router.use(protect, allowedTo('admin'));

router.route('/')
  .post(uploadMixOfImages, createProductValidator, createProduct);

router.route('/:id')
  .put(updateProductValidator, updateProduct)
  .delete(deleteProductValidator, deleteProduct);

export default router;