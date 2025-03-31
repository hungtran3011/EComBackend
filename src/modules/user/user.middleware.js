import jwt from "jsonwebtoken"
import { config } from "dotenv"
import tokenService from "../../common/services/token.service.js"
import cookieParser from "cookie-parser"

config()

/**
 * @name userMiddleware
 * @description Middleware kiểm tra người dùng đã đăng nhập hay chưa và token không bị blacklist
 * @example `router.get("/some-protected-route", userMiddleware, (req, res) => { ... })`
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const userMiddleware = async (req, res, next) => {
  const defaultUser = {
    role: "anon",
    id: ""
  }

  // Get authorization header, accounting for case sensitivity issues
  const authHeader = req.headers.authorization || req.headers.Authorization || req.header('Authorization');
  
  // Check if Authorization header exists
  if (!authHeader) {
    req.user = defaultUser;
    return res.status(401).json({ message: "No authorization header provided" });
  }

  // Extract token from Authorization header
  // More permissive split that handles different formats (space, comma, etc.)
  const parts = authHeader.split(/[ ,]+/);
  
  let token;
  // Try to find a Bearer token or just use the first token-like part
  if (parts.length > 1 && parts[0].toLowerCase() === 'bearer') {
    token = parts[1];
  } else {
    // Fallback: use the whole header as token if it looks like a JWT
    token = authHeader.includes('.') ? authHeader : parts[0];
  }
  
  if (!token) {
    req.user = defaultUser;
    return res.status(401).json({ message: "No token provided" });
  }
  
  try {
    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      req.user = defaultUser;
      return res.status(401).json({ message: "Token has been revoked" });
    }
    
    // Verify token
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Store token for possible later use (e.g., blacklisting during logout)
    req.token = token;
    
    // Token is valid - set user info and proceed
    req.user = user;
    next();
  } catch (err) {
    req.user = defaultUser;
    if (err.name === "TokenExpiredError") {
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
  try {
    await userMiddleware(req, res, () => {
      // User middleware succeeded, now check if user is admin
      if (req.user && req.user.role === 'admin') {
        // Verify with admin token secret if it exists
        if (process.env.ADMIN_ACCESS_TOKEN_SECRET) {
          try {
            const adminUser = jwt.verify(req.token, process.env.ADMIN_ACCESS_TOKEN_SECRET);
            req.user = adminUser; // Update user with admin verification
            return next();
          } catch (err) {
            // Failed admin token verification
            return res.status(403).json({ message: "Invalid admin token" });
          }
        } else {
          // No separate admin token secret, proceed if role is admin
          return next();
        }
      } else {
        // User is not admin
        return res.status(403).json({ message: "Admin privileges required" });
      }
    });
  } catch (error) {
    // This should not happen normally since userMiddleware handles its own errors
    return res.status(500).json({ message: "Authentication error" });
  }
}