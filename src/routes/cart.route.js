import { Router } from "express";
import { CartControllers } from "../controllers/cart.controller";
import { userMiddleware } from "../middleware/user.middleware";

const router = Router()

router.route("/cart")
  .get(userMiddleware, CartControllers.getAllUserCart)
  .post(userMiddleware, CartControllers.addToCart)
  .delete(userMiddleware, CartControllers.deleteCartItem)