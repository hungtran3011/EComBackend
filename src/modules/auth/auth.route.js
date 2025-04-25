import { IPRateLimiter } from "../../common/config/rate-limit.js"
import AuthControllers from "./auth.controller.js"
import { Router } from "express"
import { userMiddleware, adminMiddleware } from "../user/user.middleware.js"
import cookieParser from "cookie-parser";
import session from "express-session";
import {csrfProtection} from "../../common/middlewares/csrf.middleware.js"

const router = Router()

// Sử dụng cookie-parser để đọc cookies
router.use(cookieParser());
router.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
router.use(csrfProtection());

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
 * POST /auth/admin/refresh-token
 * @description Route to refresh admin access token using refresh token cookie
 */
router.post("/admin/refresh-token", IPRateLimiter, AuthControllers.handleAdminRefreshToken)

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
router.post("/admin/sign-out", adminMiddleware, AuthControllers.handleLogout)

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
router.get("/csrf-token", async (req, res) => {
  try {
    // Check for existing token
    let csrfToken = req.cookies['csrf-token'];
    
    // If no token exists, generate a new one
    if (!csrfToken) {
      const { generateCsrfToken } = await import('../../common/middlewares/csrf.middleware.js');
      csrfToken = await generateCsrfToken(req);
      
      // Set the cookie with the same options as in middleware
      res.cookie('csrf-token', csrfToken, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 24 // 24 hours
      });
    }
    
    // Return the token
    return res.json({ csrfToken });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({ 
      message: 'Error generating CSRF token',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

export {router as AuthRouter}