import { Router } from "express";
import CartControllers from "../controllers/cart.controller.js";
import { userMiddleware } from "../middleware/user.middleware.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router()

router.route("/")
  .get(IPRateLimiter, userMiddleware, CartControllers.getAllUserCart)
  .post(IPRateLimiter, userMiddleware, CartControllers.addToCart)
  .delete(IPRateLimiter, userMiddleware, CartControllers.deleteCartItem)

export {router as CartRouter}
