import { Router } from "express";
import { userMiddleware } from "../user/user.middleware.js";
import OrderControllers from "./order.controller.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";

const router = Router()

router.get("/", IPRateLimiter, userMiddleware, OrderControllers.getAllOrders)

router.get("/:id", IPRateLimiter, userMiddleware, (req, res) => {
  res.send("Order route")
})

export {router as OrderRouter}