import { Router } from "express";
import { adminMiddleware } from "../common/middlewares/admin.middleware.js";
import { IPRateLimiter } from "../common/config/rate-limit.js";
import AuthControllers from "../modules/auth/auth.controller.js";
import AdminControllers from "../modules/auth/admin.controller.js";

const router = Router();

// Admin authentication - use strict rate limiting
const adminRateLimiter = IPRateLimiter(5, 15); // 5 requests per 15 minutes

// Admin login endpoint
router.post("/sign-in", adminRateLimiter, AuthControllers.adminSignIn);

// // // Apply admin middleware to all protected routes
// // router.use(adminMiddleware);

// // // Admin-only routes
// // router.get("/users", AdminControllers.getAllUsers);
// // router.post("/users", AdminControllers.createUser);
// // router.delete("/users/:id", AdminControllers.deleteUser);

// // // System management
// // router.get("/system/stats", AdminControllers.getSystemStats);
// // router.post("/system/cache/clear", AdminControllers.clearSystemCache);

// // // Security operations
// // router.post("/security/force-logout/:userId", AdminControllers.forceUserLogout);
// // router.get("/security/audit-log", AdminControllers.getAuditLog);

// export { router as AdminRouter };