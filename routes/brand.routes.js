import { Router } from "express";

import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";

import upload, {
  validateImageContent,
} from "../middlewares/upload.middleware.js";

const router = Router();

// Create Brand
router.post(
  "/",
  upload.single("image"),
  validateImageContent,
  createBrand
);

// Get All Brands
router.get("/", getAllBrands);

// Get Brand By ID
router.get("/:id", getBrandById);

// Update Brand
router.patch(
  "/:id",
  upload.single("image"),
  validateImageContent,
  updateBrand
);

// Delete Brand
router.delete("/:id", deleteBrand);

export default router;
