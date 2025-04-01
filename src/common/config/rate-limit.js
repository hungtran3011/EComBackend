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
  max: 30,
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
  keyGenerator: (req) => {
    const ipAddress =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "Unknown IP";
    const userAgent = req.headers["user-agent"] || "Unknown User Agent";
    return `${ipAddress}::${userAgent}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
      retryAfter: 900,
    });
  },
});

export { uploadRateLimiter, IPRateLimiter };