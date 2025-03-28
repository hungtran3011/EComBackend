import { Router } from "express";
import { userMiddleware } from "../middleware/user.middleware.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router()

export {router as UploadRouter}