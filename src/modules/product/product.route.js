import { Router } from "express";
import { userMiddleware, adminMiddleware } from "../user/user.middleware.js";
import ProductControllers from "./product.controller.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";
import { cacheMiddleware } from "../../common/middlewares/cache.middleware.js";
import multer from 'multer';
import path from 'path';

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/temp'); // Temporary storage before Cloudinary upload
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

const router = Router();

// ===== PRODUCT ROUTES =====
// List products
router.get("/", IPRateLimiter, ProductControllers.getAllProducts);
router.get("/count", IPRateLimiter, ProductControllers.getProductCount);

// ===== CATEGORY ROUTES =====
// List categories (no ID parameter)
router.get("/category", IPRateLimiter, ProductControllers.getAllCategories);

// Category by name - MUST COME BEFORE /:id routes
router.get("/category/name/:name", IPRateLimiter, ProductControllers.getCategoryByName);

// Category CRUD operations
router.post("/category", IPRateLimiter, adminMiddleware, ProductControllers.createCategory);
router.get("/category/:id", IPRateLimiter, ProductControllers.getCategoryById);
router.put("/category/:id", IPRateLimiter, adminMiddleware, ProductControllers.updateCategory);
router.delete("/category/:id", IPRateLimiter, adminMiddleware, ProductControllers.deleteCategory);

// Product CRUD operations
router.post("/", IPRateLimiter, adminMiddleware, ProductControllers.createProduct);
router.get("/:id", IPRateLimiter, ProductControllers.getProductById);
router.put("/:id", IPRateLimiter, adminMiddleware, ProductControllers.updateProduct);
router.delete("/:id", IPRateLimiter, adminMiddleware, ProductControllers.deleteProduct);

// ===== PRODUCT IMAGE ROUTES =====
router.post(
  '/:id/images',
  adminMiddleware, 
  upload.array('images', 10), // Allow up to 10 images
  ProductControllers.uploadProductImages
);

router.delete(
  '/:productId/images/:imageId',
  adminMiddleware,
  ProductControllers.deleteProductImage
);

// ===== VARIATION ROUTES =====
router.get("/:productId/variations", IPRateLimiter, ProductControllers.getProductVariations);
router.post("/:productId/variations", IPRateLimiter, adminMiddleware, ProductControllers.createProductVariation);
router.put("/variations/:variationId", IPRateLimiter, adminMiddleware, ProductControllers.updateProductVariation);
router.delete("/variations/:variationId", IPRateLimiter, adminMiddleware, ProductControllers.deleteProductVariation);

export { router as ProductRouter };