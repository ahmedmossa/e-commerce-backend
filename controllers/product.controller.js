import Product from '../models/Product.model.js';

// Get all products
// GET /api/v1/products
export const getProducts = async (req, res) => {
  const products = await Product.find({});

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: { products },
  });
};

// Get one product by ID
// GET /api/v1/products/:id
export const getProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({
      status: 'fail',
      message: 'Product not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { product },
  });
};

// Create a new product
// POST /api/v1/products
export const createProduct = async (req, res) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { product: newProduct },
  });
};

// Update a product
// PUT /api/v1/products/:id
export const updateProduct = async (req, res) => {
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
    return res.status(404).json({
      status: 'fail',
      message: 'Product not found for update',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { product: updatedProduct },
  });
};

// Delete a product
// DELETE /api/v1/products/:id
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({
      status: 'fail',
      message: 'Product not found for deletion',
    });
  }

  res.status(204).send();
};