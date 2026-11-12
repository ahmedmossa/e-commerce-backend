import mongoose from "mongoose";
import Category from "../models/category.model.js";
import uploadToCloudinary from "../utils/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";
import SubCategory from "../models/subCategory.model.js";


export const createCategory = async (req, res) => {
  try {
    // 1. Get data from request body
    const { name, description } = req.body;
    if (!name || !name.trim()) {
  return res.status(400).json({
    message: "Category name is required",
  });
}

    // 2. Check if image exists
    if (!req.file) {
      return res.status(400).json({
        message: "Category image is required",
      });
    }

    // 3. Upload image to Cloudinary
    const image = await uploadToCloudinary(
      req.file.buffer,
      "categories"
    );

    // 4. Create category in database
    const category = await Category.create({
      name,
      description,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
    });

    // 5. Send response
    return res.status(201).json({
      message: "Category created successfully",
      category,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
};
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};
export const getCategoryById = async (req, res) => {
  try {
   const { id } = req.params;

if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({
    message: "Invalid category ID",
  });
}

const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};
////////////////////
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const { name, description } = req.body;

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;

    let oldPublicId;

    if (req.file) {
      const image = await uploadToCloudinary(
        req.file.buffer,
        "categories"
      );

      oldPublicId = category.image.public_id;

      category.image = {
        url: image.url,
        public_id: image.public_id,
      };
    }

    await category.save();

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.error("Failed to delete old category image:", error);
      }
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update category",
      error: error.message,
    });
  }
};
/////////////////////////////////////////////////////////////
//delete
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    const subCategories = await SubCategory.find({
  category: id,
});

if (subCategories.length > 0) {
  return res.status(400).json({
    message: "Cannot delete category because it has subcategories",
  });
}

    // Delete category image from Cloudinary
    try {
      await cloudinary.uploader.destroy(category.image.public_id);
    } catch (error) {
      console.error("Failed to delete category image:", error);
    }

    // Delete category from MongoDB
    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Category deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
};