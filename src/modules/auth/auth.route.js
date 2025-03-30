import { IPRateLimiter } from "../../common/config/rate-limit.js"
import AuthControllers from "./auth.controller.js"
import { Router } from "express"
import { userMiddleware, adminMiddleware } from "../user/user.middleware.js"
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

/**
 * @swagger
 * /auth/csrf-token:
 *   get:
 *     tags: [Auth]
 *     summary: Get a new CSRF token
 *     description: Route to get a new CSRF token. The token should be sent in the `X-CSRF-Token` header for subsequent requests.
 *     security:
 *        - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success response with CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *             example:
 *               csrfToken: "example-csrf-token"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Forbidden"
 */
/**
 * GET /auth/csrf-token
 * @summary Get a new CSRF token
 * @tags Authentication
 * @description Route to get a new CSRF token. The token should be sent in the `X-CSRF-Token` header for subsequent requests.
 * @response 200 - Success response with CSRF token
 * @responseContent {object} 200.application/json
 */
router.get("/csrf-token", (req, res) => {
  // Get token from cookie (set by middleware)
  const csrfToken = req.cookies['csrf-token'];
  
  if (csrfToken) {
    // Return existing token
    return res.json({ csrfToken });
  }
  
  // If no token exists yet, we need to trigger token creation
  // by running through the csrfProtection middleware again
  else res.json({ 
    csrfToken: req.cookies['csrf-token'] || 'Token will be set in cookie. Check your cookies.' 
  });
});

export {router as AuthRouter}