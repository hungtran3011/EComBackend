import { Router } from "express";
import { userMiddleware, adminMiddleware } from "../user/user.middleware.js";
import OrderControllers from "./order.controller.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";

const router = Router()

// Get all orders (admin sees all, users see their own)
router.get("/", IPRateLimiter, userMiddleware, OrderControllers.getAllOrders);

// Get order by ID
router.get("/:id", IPRateLimiter, userMiddleware, OrderControllers.getOrderById);

// Create a new order
router.post("/", IPRateLimiter, userMiddleware, OrderControllers.createOrder);

// Guest checkout - no authentication required
router.post("/guest-checkout", IPRateLimiter, OrderControllers.createGuestOrder);

// Order status management
router.put("/:id/cancel", IPRateLimiter, userMiddleware, OrderControllers.cancelOrder);
router.put("/:id/complete", IPRateLimiter, adminMiddleware, OrderControllers.completeOrder);
// Add this new route for status updates
router.put("/:id/status", IPRateLimiter, adminMiddleware, OrderControllers.updateOrderStatus);

// Update order details
router.put("/:id", IPRateLimiter, adminMiddleware, OrderControllers.updateOrder);

export { router as OrderRouter };