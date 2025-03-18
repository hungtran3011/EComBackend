import { Router } from "express";
import ProductControllers from "../controllers/product.controller.js"
import {userMiddleware} from "../middleware/user.middleware.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router();

router.route("/")
  .get(IPRateLimiter, ProductControllers.getAllProducts)
  .post(IPRateLimiter, userMiddleware, ProductControllers.createProduct);

router.route("/:id")
  .get(IPRateLimiter, ProductControllers.getProductById)
  .put(userMiddleware, ProductControllers.updateProduct)
  .delete(userMiddleware, ProductControllers.deleteProduct);

router.route("/categories")
  .get(IPRateLimiter, ProductControllers.getAllCategories)
  .post(userMiddleware, ProductControllers.createCategory);

router.route("/categories/:id")
  .get(IPRateLimiter, ProductControllers.getCategoryById)
  .put(userMiddleware, ProductControllers.updateCategory)
  .delete(userMiddleware, ProductControllers.deleteCategory);

export {router as ProductRouter};