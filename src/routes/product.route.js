import { Router } from "express";
import {ProductControllers} from "../controllers/product.controller.js"

const router = Router();

router.route("/products")
  .get((req, res) => ProductControllers.getAllProducts(req, res))
  .post((req, res) => ProductControllers.createProduct(req, res));

router.route("/products/:id")
  .get((req, res) => ProductControllers.getProductById(req, res))
  .put((req, res) => ProductControllers.updateProduct(req, res))
  .delete((req, res) => ProductControllers.deleteProduct(req, res));

router.route("/categories")
  .get((req, res) => ProductControllers.getAllCategories(req, res))
  .post((req, res) => ProductControllers.createCategory(req, res));

router.route("/categories/:id")
  .get((req, res) => ProductControllers.getCategoryById(req, res))
  .put((req, res) => ProductControllers.updateCategory(req, res))
  .delete((req, res) => ProductControllers.deleteCategory(req, res));

export {router as ProductRouter};