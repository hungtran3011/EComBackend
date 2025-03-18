import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware";
import OrderControllers from "../controllers/order.controller";

const router = Router()

router.get("/", userMiddleware, OrderControllers.getAllOrders)

router.get("/:id", userMiddleware, (req, res) => {
  res.send("Order route")
})

export {router as OrderRouter}