import { IPRateLimiter } from "../../common/config/rate-limit.js"
import AuthControllers from "./auth.controller.js"
import { Router } from "express"
import { userMiddleware, adminMiddleware } from "../user/user.middleware.js"
import cookieParser from "cookie-parser";
import session from "express-session";
import { config } from "dotenv";
import {csrfProtection, generateCsrfToken} from "../../common/middlewares/csrf.middleware.js"
import { debugLogger } from "../../common/middlewares/debug-logger.js";

config();
const router = Router()
const logger = debugLogger("auth-route")

// Sử dụng cookie-parser để đọc cookies
router.use(cookieParser());
router.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
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
 *     summary: Get a CSRF token
 *     description: Get a CSRF token for use in subsequent requests. The token remains stable for the session duration.
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
 *                   description: Token to be included in X-CSRF-Token header for requests
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
    logger.debug("CSRF token request received");
    
    // Generate token
    const csrfToken = await generateCsrfToken();
    
    // Dynamically determine domain from request or env
    const domain = process.env.NODE_ENV === 'production' 
      ? process.env.DOMAIN
      : undefined;
      
    logger.debug(`Using domain for cookie: ${domain || 'localhost'}`);
    
    // Set cookie with domain from environment
    res.cookie('csrf-token', csrfToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'none',
      secure: true,
      domain: domain ? `.${domain}` : undefined, // Add dot prefix for subdomains
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    logger.debug(`Setting CSRF token cookie`);
    
    // Return token in response
    return res.status(200).json({ csrfToken });
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    return res.status(500).json({ message: 'Error generating CSRF token' });
  }
});

export {router as AuthRouter}