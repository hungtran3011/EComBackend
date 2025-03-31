import { Router } from "express";
import CartControllers from "./cart.controller.js";
import { userMiddleware } from "../user/user.middleware.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";

const router = Router()

router.route("/")
  .get(IPRateLimiter, userMiddleware, CartControllers.getAllUserCart)
  .post(IPRateLimiter, userMiddleware, CartControllers.addToCart)
  .delete(IPRateLimiter, userMiddleware, CartControllers.deleteCartItem)

export {router as CartRouter}
