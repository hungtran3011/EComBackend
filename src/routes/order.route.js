import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware.js";
import OrderControllers from "../controllers/order.controller.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router()

router.get("/", IPRateLimiter, userMiddleware, OrderControllers.getAllOrders)

router.get("/:id", IPRateLimiter, userMiddleware, (req, res) => {
  res.send("Order route")
})

export {router as OrderRouter}