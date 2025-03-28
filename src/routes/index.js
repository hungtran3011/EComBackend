import { UserRouter } from "./user.route.js";
import { ProductRouter } from "./product.route.js";
import { OrderRouter } from "./order.route.js";
import { CartRouter } from "./cart.route.js";
import { Router } from "express";
import { AuthRouter } from "./auth.route.js";
// import { AdminRouter } from "./admin.route.js";

const router = Router()

router.use("/auth", AuthRouter)
router.use("/user", UserRouter)
router.use("/product", ProductRouter)
router.use("/order", OrderRouter)
router.use("/cart", CartRouter)
// router.use("/admin", AdminRouter)

export { router as MainRouter }