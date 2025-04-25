import mongoose from "mongoose";
import { StorageItemModel } from "./storage.schema.js";
import { ProductValidationSchema, isValidMongoId } from "../../common/validators/product.validator.js";
import { Product } from "../product/product.schema.js";

const getProductQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate productId format
    if (!isValidMongoId(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }
    
    const storageItem = await StorageItemModel.findOne({ product: productId });

    if (!storageItem) {
      return res.status(404).json({ message: "Product not found in storage" });
    }

    return res.status(200).json({ productId, quantity: storageItem.quantity });
  } catch (error) {
    console.error("Error fetching product quantity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProductQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate productId format
    if (!isValidMongoId(productId)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // Validate quantity
    if (quantity === undefined) {
      return res.status(400).json({ message: "Quantity is required" });
    }
    
    // Ensure quantity is a number
    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity)) {
      return res.status(400).json({ message: "Quantity must be a number" });
    }

    // Ensure quantity is not negative
    if (parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }
    
    // Check if product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update storage item
    const storageItem = await StorageItemModel.findOneAndUpdate(
      { product: productId },
      { quantity: parsedQuantity },
      { new: true, upsert: true }
    );

    return res.status(200).json({ 
      productId, 
      quantity: storageItem.quantity,
      message: "Product quantity updated successfully" 
    });
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getStorage = async (req, res) => {
  try {
    const storageItems = await StorageItemModel.find().populate("product");
    return res.status(200).json({ items: storageItems });
  } catch (error) {
    console.error("Error fetching storage:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateStorage = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items format" });
    }

    const bulkOperations = items.map((item) => ({
      updateOne: {
        filter: { product: item.product },
        update: { quantity: item.quantity },
        upsert: true,
      },
    }));

    await StorageItemModel.bulkWrite(bulkOperations);

    return res.status(200).json({ message: "Storage updated successfully" });
  } catch (error) {
    console.error("Error updating storage:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const StorageControllers = {
  getProductQuantity,
  updateProductQuantity,
  getStorage,
  updateStorage,
};

export default StorageControllers;