import jwt from "jsonwebtoken"
import { config } from "dotenv"

config()

/**
 * @name userMiddleware
 * @description Middleware kiểm tra người dùng đã đăng nhập hay chưa
 * @example `router.get("/some-protected-route", userMiddleware, (req, res) => { ... })`
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const userMiddleware = (req, res, next) => {
  const defaultUser = {
    role: "anon",
    id: ""
  }

  console.log(req)

  // Get authorization header, accounting for case sensitivity issues
  const authHeader = req.headers.authorization || req.headers.Authorization || req.header('Authorization');
  
  // For debugging, log the headers to see what's available
  console.log('Headers received:', Object.keys(req.headers));
  
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

  // Verify token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      req.user = defaultUser;
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(403).json({ message: "Invalid token", error: err.message });
    }
    
    // Token is valid - set user info and proceed
    req.user = user;
    next();
  });
}