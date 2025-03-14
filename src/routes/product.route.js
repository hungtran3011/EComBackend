import { Router } from "express";
import {ProductControllers} from "../controllers/product.controller.js"
import {userMiddleware} from "../middleware/user.middleware.js";

const router = Router();

router.route("/products")
  .get(ProductControllers.getAllProducts)
  .post(userMiddleware, ProductControllers.createProduct);

router.route("/products/:id")
  .get(ProductControllers.getProductById)
  .put(userMiddleware, ProductControllers.updateProduct)
  .delete(userMiddleware, ProductControllers.deleteProduct);

router.route("/categories")
  .get(ProductControllers.getAllCategories)
  .post(userMiddleware, ProductControllers.createCategory);

router.route("/categories/:id")
  .get(ProductControllers.getCategoryById)
  .put(userMiddleware, ProductControllers.updateCategory)
  .delete(userMiddleware, ProductControllers.deleteCategory);

export {router as ProductRouter};