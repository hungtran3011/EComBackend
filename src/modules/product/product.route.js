import { Router } from "express";
import { userMiddleware } from "../user/user.middleware.js";
import ProductControllers from "./product.controller.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";
import { cacheMiddleware } from "../../common/middlewares/cache.middleware.js";

const router = Router();

// Áp dụng caching 5 phút cho route lấy tất cả sản phẩm
router.get("/", IPRateLimiter, cacheMiddleware(300), ProductControllers.getAllProducts);

// Áp dụng caching 10 phút cho route lấy chi tiết sản phẩm
router.get("/:id", IPRateLimiter, cacheMiddleware(600), ProductControllers.getProductById);

// Các route khác không cần cache vì là write operation
router.post("/", IPRateLimiter, userMiddleware, ProductControllers.createProduct);
router.put("/:id", IPRateLimiter, userMiddleware, ProductControllers.updateProduct);
router.delete("/:id", IPRateLimiter, userMiddleware, ProductControllers.deleteProduct);

export { router as ProductRouter };