import { Router } from "express";
import SearchController from "./search.controller.js";
import { cacheMiddleware } from "../../common/middlewares/cache.middleware.js";

const router = Router();

// Search products with caching (5 minutes)
router.get("/", cacheMiddleware(300), SearchController.searchProducts);

// Get product name suggestions with caching (15 minutes)
router.get("/suggestions", cacheMiddleware(900), SearchController.getProductSuggestions);

export { router as SearchRouter };