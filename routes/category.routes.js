import { Router } from "express";

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import upload, {
  validateImageContent,
} from "../middlewares/upload.middleware.js";

const router = Router();

// Create Category
router.post(
  "/",
  upload.single("image"),
  validateImageContent,
  createCategory
);

// Get All Categories
router.get("/", getAllCategories);

// Get Category By ID
router.get("/:id", getCategoryById);

// Update Category
router.patch(
  "/:id",
  upload.single("image"),
  validateImageContent,
  updateCategory
);

// Delete Category
router.delete("/:id", deleteCategory);

export default router;
