import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware";
import OrderControllers from "../controllers/order.controller";

const route = Router()

route.get("/order", userMiddleware, (req, res) => {
  res.send("Order route")
})

route.get("/order/:id", userMiddleware, (req, res) => {
  res.send("Order route")
})