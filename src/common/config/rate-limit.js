import rateLimit from "express-rate-limit";

/**
 * @name uploadRateLimiter
 * @author hungtran3011
 * @description Hạn chế tần suất upload của người dùng
 * 
 * Middleware sẽ hạn chế tần suất upload của người dùng nếu:
 * - khung thời gian (window frame): 15 phút
 * - số lượng request tối đa: 30
 * - id của item được upload
 * 
 * Trả về HTTP status 429 nếu quá nhiều request
 */
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : true,
  keyGenerator: (req) => req.params.id,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
      retryAfter: 900,
    });
  },
});

/**
 * @name IPRateLimiter
 * @author hungtran3011
 * @description Hạn chế tần suất thao tác chung của người dùng
 * 
 * Middleware sẽ hạn chế tần suất thao tác của người dùng dựa trên địa chỉ IP (đọc từ header của Cloudflare):
 * - khung thời gian (window frame): 15 phút
 * - số lượng request tối đa: 100
 * - định danh dựa trên địa chỉ IP và user-agent
 * 
 * Trả về HTTP status 429 nếu quá nhiều request
 */
const IPRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : true,
  keyGenerator: (req) => {
    // For production environments with Cloudflare
    // Get client IP using X-Forwarded-For header
    let ipAddress;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, trust the leftmost proxy
      const forwardedIps = req.headers['x-forwarded-for'];
      ipAddress = forwardedIps ? forwardedIps.split(',')[0].trim() : req.ip;
    } else {
      // In development, use standard Express IP resolution
      ipAddress = req.ip;
    }
    
    const userAgent = req.headers["user-agent"] || "Unknown User Agent";
    return `${ipAddress}::${userAgent}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
      retryAfter: 900,
    });
  },
  // Add standardHeaders and legacyHeaders options for comprehensive rate limit info
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export { uploadRateLimiter, IPRateLimiter };