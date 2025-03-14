import mongoose from "mongoose";
import ProductModel from "../schemas/product.schema.js";

const getAllProducts = async (req, res) => {
  try {
    const products = await ProductModel.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getProductById = async (req, res) => {}

const createProduct = async (req, res) => {}

const updateProduct = async (req, res) => {}

const deleteProduct = async (req, res) => {}

const getAllCategories = async (req, res) => {}

const getCategoryById = async (req, res) => {}

const createCategory = async (req, res) => {}

const updateCategory = async (req, res) => {}

const deleteCategory = async (req, res) => {}



const ProductControllers = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default ProductControllers;