import mongoose from "mongoose";
import Brand from "../models/brand.model.js";
import uploadToCloudinary from "../utils/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";
////////
//create
export const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
  return res.status(400).json({
    message: "Brand name is required",
  });
}

    if (!req.file) {
      return res.status(400).json({
        message: "Brand image is required",
      });
    }

    const image = await uploadToCloudinary(
      req.file.buffer,
      "brands"
    );

    const brand = await Brand.create({
      name,
      description,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
    });

    return res.status(201).json({
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Brand name already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create brand",
      error: error.message,
    });
  }
};
////////////////////////////////
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();

    return res.status(200).json({
      message: "Brands fetched successfully",
      brands,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch brands",
      error: error.message,
    });
  }
};
/////////////////////
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid brand ID",
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      message: "Brand fetched successfully",
      brand,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch brand",
      error: error.message,
    });
  }
};
//////////////////////////
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid brand ID",
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    const { name, description } = req.body;

    if (name !== undefined) brand.name = name;
    if (description !== undefined) brand.description = description;

    let oldPublicId;

    if (req.file) {
      const image = await uploadToCloudinary(
        req.file.buffer,
        "brands"
      );

      oldPublicId = brand.image.public_id;

      brand.image = {
        url: image.url,
        public_id: image.public_id,
      };
    }

    await brand.save();

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.error("Failed to delete old brand image:", error);
      }
    }

    return res.status(200).json({
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Brand name already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update brand",
      error: error.message,
    });
  }
};
///////////////////////////
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid brand ID",
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    try {
      await cloudinary.uploader.destroy(brand.image.public_id);
    } catch (error) {
      console.error("Failed to delete brand image:", error);
    }

    await Brand.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Brand deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete brand",
      error: error.message,
    });
  }
};
