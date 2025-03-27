import { IPRateLimiter } from "../config/rate-limit.js"
import AuthControllers from "../controllers/auth.controller.js"
import { Router } from "express"
import { userMiddleware, adminMiddleware } from "../middleware/user.middleware.js"
import cookieParser from "cookie-parser";

/**
 * @name router
 * @description Router for authentication endpoints
 * @type {Router}
 */
const router = Router()

// Sử dụng cookie-parser để đọc cookies
router.use(cookieParser());

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
 * POST /auth/sign-out
 * @description Route for user logout
 */
router.post("/sign-out", userMiddleware, AuthControllers.handleLogout)

/**
 * POST /auth/refresh-token
 * @description Route to refresh access token using refresh token cookie
 */
router.post("/refresh-token", IPRateLimiter, AuthControllers.handleRefreshToken)

/**
 * POST /auth/send-otp
 * @description Route to send OTP for login
 */
router.post("/send-otp", IPRateLimiter, AuthControllers.sendLoginOTP)

/**
 * POST /auth/sign-in-otp
 * @description Route for user login with OTP
 */
router.post("/sign-in-otp", IPRateLimiter, AuthControllers.signInWithOTP)

/**
 * POST /auth/admin/sign-in
 * @description Route for administrator login (restricted)
 */
router.post("/admin/sign-in", IPRateLimiter, AuthControllers.adminSignIn)

/**
 * POST /auth/admin-sign-out
 * @description Route for admin logout
 */
router.post("/admin-sign-out", adminMiddleware, AuthControllers.handleLogout)

/**
 * POST /auth/send-password-reset-otp
 * @description Route to send OTP for password reset
 */
router.post("/send-password-reset-otp", IPRateLimiter, AuthControllers.sendPasswordResetOTP)

/**
 * POST /auth/reset-password
 * @description Route to reset password using OTP
 */
router.post("/reset-password", IPRateLimiter, AuthControllers.resetPassword)

/**
 * GET /auth/check-auth
 * @description Route to check if user is authenticated
 */
router.get("/check-auth", IPRateLimiter, userMiddleware, (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: {
      id: req.user.id,
      role: req.user.role
    }
  })
})

export {router as AuthRouter}