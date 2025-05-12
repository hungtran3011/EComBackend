import jwt from "jsonwebtoken";
import { User } from "../../modules/user/user.schema.js";
import { debugLogger } from "./debug-logger.js";

const logger = debugLogger("admin-middleware");

/**
 * Middleware to verify admin authentication
 * Provides stronger checks than regular user middleware
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // 1. Extract and validate authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Token validation with admin-specific secret
    jwt.verify(
      token, 
      process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, 
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // 3. Verify explicit admin flag
        if (!decoded.isAdmin || decoded.role !== "admin") {
          return res.status(403).json({ message: "Admin privileges required" });
        }
        
        // // 4. IP binding validation (optional but recommended)
        // const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // if (decoded.clientIP && decoded.clientIP !== clientIP) {
        //   return res.status(403).json({ message: "Session IP mismatch" });
        // }
        
        // 5. Double-check admin status in database (prevents using old tokens after role change)
        const adminUser = await User.findOne({
          _id: decoded.id,
          role: "admin"
        });
        
        if (!adminUser) {
          return res.status(403).json({ message: "Admin privileges revoked" });
        }
        
        // 6. Check token version for forced logout capability
        if (adminUser.tokenVersion && 
            adminUser.tokenVersion !== decoded.tokenVersion) {
          return res.status(401).json({ message: "Session expired" });
        }
        
        // 7. Add admin info to request
        req.admin = {
          id: decoded.id,
          role: decoded.role,
          permissions: adminUser.permissions || ['all']
        };
        
        // 8. Allow access to protected route
        next();
      }
    );
  } catch (error) {
    logger.error("Admin middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};