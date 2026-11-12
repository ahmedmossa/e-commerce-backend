import mongoose from 'mongoose';
import slugify from 'slugify';

// Define the Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
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

    shortDescription: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },

    discountPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
    },

    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
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

    images: [
      {
        public_id: {
          type: String,
          required: [true, 'Image public ID is required'],
        },
        url: {
          type: String,
          required: [true, 'Image URL is required'],
        },
      },
    ],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },

    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 1,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    tags: [String],

    featured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose Pre-save hook to generate slug automatically from name
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Create an index for product price and ratings
productSchema.index({ price: 1, ratingsAverage: -1 });

// Export Product Model
const Product = mongoose.model('Product', productSchema);

export default Product;