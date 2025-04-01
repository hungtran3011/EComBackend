import redisService from '../services/redis.service.js';

/**
 * @name cacheMiddleware
 * @description Middleware để caching các API response
 * @param {number} duration - Thời gian cache tính bằng giây
 * @returns {function} Express middleware
 */
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Bỏ qua cache nếu là method khác GET
    if (req.method !== 'GET') {
      return next();
    }
    
    // Tạo cache key từ URL và query parameters
    const cacheKey = `api:${req.originalUrl}`;
    
    try {
      // Kiểm tra xem response đã được cache chưa
      const cachedResponse = await redisService.get(cacheKey, true);
      
      if (cachedResponse) {
        console.log(`Lấy response từ cache: ${cacheKey}`);
        return res.json(cachedResponse);
      }
      
      // Ghi đè phương thức res.json để lưu response vào cache
      const originalJson = res.json;
      res.json = function(data) {
        // Chỉ cache nếu status code là 200
        if (res.statusCode === 200) {
          redisService.set(cacheKey, data, duration)
            .catch(err => console.error(`Lỗi khi lưu cache: ${err.message}`));
        }
        
        // Gọi phương thức gốc
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error(`Lỗi cache middleware: ${error.message}`);
      next(); // Tiếp tục request mà không dùng cache
    }
  };
};