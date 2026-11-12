import asyncHandler from 'express-async-handler';
import Product from '../models/Product.model.js';
import ApiError from '../utils/ApiError.js';
import ApiFeatures from '../utils/apiFeatures.js';

// Get all products with pagination, filtering, and sorting
// GET /api/v1/products
export const getProducts = asyncHandler(async (req, res, next) => {
  // Build query using ApiFeatures
  const features = new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .search()
    .paginate();

  // Execute query
  const products = await features.query;

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: { products },
  });
});

// Get one product by ID
// GET /api/v1/products/:id
export const getProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
});

// Create a new product
// POST /api/v1/products
export const createProduct = asyncHandler(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { product: newProduct },
  });
});

// Update a product
// PUT /api/v1/products/:id
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedProduct) {
    return next(new ApiError('Product not found for update', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { product: updatedProduct },
  });
});

// Delete a product (with Cloudinary images removal check)
// DELETE /api/v1/products/:id
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError('Product not found for deletion', 404));
  }

  // TODO: Add Cloudinary image deletion logic here using product.images or product.imageCover if needed
  // Example: 
  // for (const img of product.images) {
  //   await cloudinary.uploader.destroy(img.public_id);
  // }

  await product.deleteOne();

  res.status(204).send();
});