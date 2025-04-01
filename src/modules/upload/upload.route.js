import { Router } from "express";
import { userMiddleware } from "../user/user.middleware.js";
import { IPRateLimiter, uploadRateLimiter } from "../../common/config/rate-limit.js";
import UploadController from "./upload.controller.js";

const router = Router()

router.post("/image", userMiddleware, uploadRateLimiter, UploadController.uploadImage)
router.post("/video", userMiddleware, uploadRateLimiter, UploadController.uploadVideo)
router.delete("/delete/:id", userMiddleware, IPRateLimiter, UploadController.deleteImageOrVideo)

export {router as UploadRouter}