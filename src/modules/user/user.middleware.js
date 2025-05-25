import jwt from "jsonwebtoken"
import { config } from "dotenv"
import tokenService from "../../common/services/token.service.js"
import cookieParser from "cookie-parser"
import { debugLogger } from "../../common/middlewares/debug-logger.js"

config()

// Create logger instance
const logger = debugLogger("user-middleware");

/**
 * @name userMiddleware
 * @description Middleware kiểm tra người dùng đã đăng nhập hay chưa và token không bị blacklist
 * @example `router.get("/some-protected-route", userMiddleware, (req, res) => { ... })`
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const userMiddleware = async (req, res, next) => {
  logger.debug(`userMiddleware: Processing request to ${req.originalUrl}`);
  
  const defaultUser = {
    role: "anon",
    id: ""
  }

  // Get authorization header, accounting for case sensitivity issues
  const authHeader = req.headers.authorization || req.headers.Authorization || req.header('Authorization');
  
  // Check if Authorization header exists
  if (!authHeader) {
    logger.debug('userMiddleware: No authorization header found');
    req.user = defaultUser;
    return res.status(401).json({ message: "No authorization header provided" });
  }

  logger.debug('userMiddleware: Authorization header found, extracting token');
  
  // Extract token from Authorization header
  // More permissive split that handles different formats (space, comma, etc.)
  const parts = authHeader.split(/[ ,]+/);
  
  let token;
  // Try to find a Bearer token or just use the first token-like part
  if (parts.length > 1 && parts[0].toLowerCase() === 'bearer') {
    logger.debug('userMiddleware: Bearer token format detected');
    token = parts[1];
  } else {
    // Fallback: use the whole header as token if it looks like a JWT
    logger.debug('userMiddleware: Non-standard token format, attempting to extract JWT');
    token = authHeader.includes('.') ? authHeader : parts[0];
  }
  
  if (!token) {
    logger.debug('userMiddleware: No valid token could be extracted');
    req.user = defaultUser;
    return res.status(401).json({ message: "No token provided" });
  }
  
  logger.debug('userMiddleware: Token extracted, beginning validation');
  
  try {
    // Check if token is blacklisted
    logger.debug('userMiddleware: Checking if token is blacklisted');
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('userMiddleware: Token has been blacklisted/revoked');
      req.user = defaultUser;
      return res.status(401).json({ message: "Token has been revoked" });
    }
    
    // Verify token
    logger.debug('userMiddleware: Verifying token with JWT');
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    logger.debug(`userMiddleware: Token verified for user with role: ${user.role}`);
    
    // Store token for possible later use (e.g., blacklisting during logout)
    req.token = token;
    
    // Token is valid - set user info and proceed
    req.user = user;
    logger.debug('userMiddleware: Authentication successful, proceeding to route handler');
    next();
  } catch (err) {
    logger.error(`userMiddleware: Token validation error: ${err.message}`);
    req.user = defaultUser;
    if (err.name === "TokenExpiredError") {
      logger.debug('userMiddleware: Token has expired');
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(403).json({ message: "Invalid token", error: err.message });
  }
}

/**
 * @name adminMiddleware
 * @description Middleware kiểm tra xem người dùng có quyền admin không
 * @example `router.get("/admin-route", adminMiddleware, (req, res) => { ... })`
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const adminMiddleware = async (req, res, next) => {
  logger.debug(`adminMiddleware: Processing admin auth request to ${req.originalUrl}`);
  
  try {
    await userMiddleware(req, res, () => {
      // User middleware succeeded, now check if user is admin
      logger.debug(`adminMiddleware: User authenticated, checking admin privileges for user: ${req.user.id}`);
      
      if (req.user && req.user.role === 'admin') {
        logger.debug('adminMiddleware: User has admin role, performing additional verification');
        
        // Verify with admin token secret if it exists
        if (process.env.ADMIN_ACCESS_TOKEN_SECRET) {
          logger.debug('adminMiddleware: Using separate admin token secret for verification');
          try {
            const adminUser = jwt.verify(req.token, process.env.ADMIN_ACCESS_TOKEN_SECRET);
            logger.debug('adminMiddleware: Admin token verification successful');
            req.user = adminUser; // Update user with admin verification
            return next();
          } catch (err) {
            // Failed admin token verification
            logger.error(`adminMiddleware: Admin token verification failed: ${err.message}`);
            return res.status(403).json({ message: "Invalid admin token" });
          }
        } else {
          // No separate admin token secret, proceed if role is admin
          logger.debug('adminMiddleware: No separate admin token secret, proceeding with role-based authorization');
          return next();
        }
      } else {
        // User is not admin
        logger.warn(`adminMiddleware: Access denied - user ${req.user.id} with role ${req.user.role} attempted to access admin route`);
        return res.status(403).json({ message: "Admin privileges required" });
      }
    });
  } catch (error) {
    // This should not happen normally since userMiddleware handles its own errors
    logger.error(`adminMiddleware: Unexpected error: ${error.message}`);
    return res.status(500).json({ message: "Authentication error" });
  }
}