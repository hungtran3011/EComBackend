import mongoose from "mongoose";
import { Router } from "express";
import StorageControllers from "./storage.controller.js";

const router = Router();

// Get all storage items
router.get("/", StorageControllers.getStorage);

// Get quantity of a specific product
router.get("/:productId", StorageControllers.getProductQuantity);

// Update quantity of a specific product
router.put("/:productId", StorageControllers.updateProductQuantity);

// Bulk update storage
router.put("/", StorageControllers.updateStorage);

export { router as StorageRouter };

