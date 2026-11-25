import mongoose from "mongoose";
import Category from "../models/category.model.js";
import uploadToCloudinary from "../utils/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";
import SubCategory from "../models/subCategory.model.js";


export const createCategory = async (req, res) => {
  try {
    // 1. Get data from request body
    const { name, description } = req.body;
if (typeof name !== "string" || !name.trim()) {
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
if (!image?.url || !image?.public_id) {
return res.status(500).json({
message: "Image upload failed",
});
}
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
if (name !== undefined) {
if (typeof name !== "string" || !name.trim()) {
return res.status(400).json({
message: "Category name must be a non-empty string",
});
}
category.name = name.trim();
}
if (description !== undefined) {
category.description = description;
}


    let oldPublicId;

  
let newPublicId;
if (req.file) {
const image = await uploadToCloudinary(
req.file.buffer,
"categories"
);
if (!image?.url || !image?.public_id) {
return res.status(500).json({
message: "Image upload failed",
});
}
newPublicId = image.public_id;
oldPublicId = category.image?.public_id;
category.image = {
url: image.url,
public_id: image.public_id,
};
}
try {
await category.save();
} catch (error) {
if (newPublicId) {
await cloudinary.uploader.destroy(newPublicId);
}
throw error;
}
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

    // Save image public_id before deleting category
    const imagePublicId = category.image?.public_id;

    // Delete category from MongoDB first
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    // Delete category image from Cloudinary
    if (imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(imagePublicId);

        if (result.result !== "ok" && result.result !== "not found") {
          console.error("Unexpected Cloudinary deletion result:", result);
        }
      } catch (error) {
        console.error("Failed to delete category image:", error);
      }
    }

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