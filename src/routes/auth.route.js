import { IPRateLimiter } from "../config/rate-limit.js"
import AuthControllers from "../controllers/auth.controller.js"
import { Router } from "express"

/**
 * @name router
 * @description Router for authentication endpoints
 * @type {Router}
 */
const router = Router()

/**
 * POST /auth/sign-in
 * @description Route for user login with email/phone and password
 */
router.post("/sign-in", IPRateLimiter, AuthControllers.signIn)

/**
 * POST /auth/sign-up
 * @description Route for user registration
 */
router.post("/sign-up", IPRateLimiter, AuthControllers.registerUser)

/**
 * POST /auth/sign-out/:id
 * @description Route for user logout, requires user ID
 */
router.post("/sign-out/:id", IPRateLimiter, AuthControllers.handleLogout)

/**
 * POST /auth/refresh-token
 * @description Route to refresh access token using refresh token
 */
router.post("/refresh-token", IPRateLimiter, AuthControllers.handleRefreshToken)

export {router as AuthRouter}