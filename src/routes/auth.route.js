import { IPRateLimiter } from "../config/rate-limit.js"
import AuthControllers from "../controllers/auth.controller.js"
import { Router } from "express"

const router = Router()

router.get("/sign-in",IPRateLimiter, AuthControllers.signIn)

router.post("/sign-up", IPRateLimiter, AuthControllers.registerUser)

router.post("/sign-out", IPRateLimiter, AuthControllers.handleLogout)

router.post("/refresh-token", IPRateLimiter, AuthControllers.handleRefreshToken)

export {router as AuthRouter}