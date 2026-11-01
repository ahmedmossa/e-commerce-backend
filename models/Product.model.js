
import mongoose from 'mongoose';

// Define the Product Schema
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Product title must be at least 3 characters'],
      maxlength: [100, 'Product title cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },

    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },

    priceAfterDiscount: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
    },

    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },

    sold: {
      type: Number,
      default: 0,
    },

    imageCover: {
      type: String,
      required: [true, 'Product cover image is required'],
    },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },

    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  
  {
    timestamps: true,
  }
);
// Create an index for product price and ratings
productSchema.index({ price: 1, ratingsAverage: -1 });

// Export Product Model
const Product = mongoose.model('Product', productSchema);

export default Product;
