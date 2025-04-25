import { UserRouter } from "../modules/user/user.route.js";
import { ProductRouter } from "../modules/product/product.route.js";
import { OrderRouter } from "../modules/order/order.route.js";
import { CartRouter } from "../modules/cart/cart.route.js";
import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route.js";
import { UploadRouter } from "../modules/upload/upload.route.js";
import { SearchRouter } from "../modules/search/search.route.js";
import { StorageRouter } from "../modules/storage/storage.route.js";
// import { AdminRouter } from "./admin.route.js";

const router = Router()

router.use("/auth", AuthRouter)
router.use("/user", UserRouter)
router.use("/product", ProductRouter)
router.use("/order", OrderRouter)
router.use("/cart", CartRouter)
router.use("/upload", UploadRouter)
router.use("/search", SearchRouter)
router.use("/storage", StorageRouter)
// router.use("/admin", AdminRouter)

export { router as MainRouter }