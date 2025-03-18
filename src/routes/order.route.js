import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware";
import OrderControllers from "../controllers/order.controller";
import { IPRateLimiter } from "../config/rate-limit";

const router = Router()

router.get("/", IPRateLimiter, userMiddleware, OrderControllers.getAllOrders)

router.get("/:id", IPRateLimiter, userMiddleware, (req, res) => {
  res.send("Order route")
})

export {router as OrderRouter}