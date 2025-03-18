import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware";
import OrderControllers from "../controllers/order.controller";

const router = Router()

router.get("/order", userMiddleware, OrderControllers.getAllOrders)

router.get("/order/:id", userMiddleware, (req, res) => {
  res.send("Order route")
})