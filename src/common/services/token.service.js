import redisService from './redis.service.js';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { debugLogger } from '../middlewares/debug-logger.js';

config();
const logger = debugLogger('token-service');


/**
 * @name TokenService
 * @description Service quản lý token xác thực sử dụng Redis
 * Cung cấp các chức năng làm việc với access tokens, refresh tokens và blacklist
 */

// Cấu hình prefix cho các loại keys trong Redis
const TOKEN_PREFIXES = {
  REFRESH: 'auth:refresh:',
  BLACKLIST: 'auth:blacklist:'
};

// Thời hạn mặc định
const DEFAULT_ACCESS_TOKEN_TTL = 60 * 60 * 24; // 1 ngày
const DEFAULT_REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 ngày
const DEFAULT_ADMIN_TOKEN_TTL = 60 * 60; // 1 giờ
const DEFAULT_ADMIN_REFRESH_TOKEN_TTL = 4 * 60 * 60; // 4 giờ

/**
 * @name generateAccessToken
 * @description Tạo JWT access token cho người dùng
 * @param {object} user - ID người dùng hoặc thông tin người dùng
 * @param {boolean} isAdmin - Có phải là token admin không
 * @returns {string} JWT access token
 */
const generateAccessToken = (user, isAdmin = false) => {
  // const userInfo = typeof user === 'object' ? user._id || user.id : user;
  const role = typeof user === 'object' ? user.role : 'customer';
  
  const payload = { 
    user: user,
    role,
    iat: Math.floor(Date.now() / 1000)
  };
  
  if (isAdmin) {
    payload.isAdmin = true;
  }
  
  const secret = isAdmin 
    ? process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET 
    : process.env.ACCESS_TOKEN_SECRET;
    
  const expiresIn = isAdmin 
    ? process.env.ADMIN_TOKEN_EXPIRY || DEFAULT_ADMIN_TOKEN_TTL
    : process.env.ACCESS_TOKEN_EXPIRY || DEFAULT_ACCESS_TOKEN_TTL;
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * @name generateRefreshToken
 * @description Tạo JWT refresh token cho người dùng
 * @param {object} user - ID người dùng hoặc thông tin người dùng
 * @param {boolean} isAdmin - Có phải là token admin không
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user, isAdmin = false) => {
  const userInfo = user;
  const role = typeof user === 'object' ? user.role : 'customer';
  
  // Fix: Use user ID instead of the whole user object for JTI
  const userId = typeof user === 'object' ? (user.id || user._id) : user;
  const jti = `${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const payload = { 
    user: userInfo, 
    role,
    jti,
    iat: Math.floor(Date.now() / 1000)
  };
  
  if (isAdmin) {
    payload.isAdmin = true;
  }
  
  const secret = isAdmin 
    ? process.env.ADMIN_REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET 
    : process.env.REFRESH_TOKEN_SECRET;
    
  const expiresIn = isAdmin 
    ? process.env.ADMIN_REFRESH_TOKEN_EXPIRY || DEFAULT_ADMIN_REFRESH_TOKEN_TTL
    : process.env.REFRESH_TOKEN_EXPIRY || DEFAULT_REFRESH_TOKEN_TTL;
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * @name saveRefreshToken
 * @description Lưu refresh token vào Redis
 * @param {string} userId - ID người dùng
 * @param {string} refreshToken - Refresh token cần lưu
 * @param {boolean} isAdmin - Có phải là token admin không
 * @returns {Promise<void>}
 */
const saveRefreshToken = async (userId, refreshToken, isAdmin = false) => {
  try {
    // Giải mã token để lấy thời gian hết hạn
    const decoded = jwt.decode(refreshToken);
    if (!decoded) throw new Error('Invalid refresh token');
    
    // Tính TTL dựa trên thời gian hết hạn
    const expiryTime = decoded.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiryTime - now;
    
    if (ttl <= 0) throw new Error('Token has already expired');
    
    // Lưu token với unique key dựa trên jti
    const tokenKey = `${TOKEN_PREFIXES.REFRESH}${userId}:${decoded.jti}`;
    
    // Lưu thêm thông tin vào Redis để dễ quản lý
    const tokenData = {
      token: refreshToken,
      userId,
      isAdmin: isAdmin || decoded.isAdmin || false,
      createdAt: now,
      expiresAt: expiryTime
    };
    
    await redisService.set(tokenKey, tokenData, ttl);
    
    // Lưu jti vào danh sách token của user để dễ tìm kiếm
    const userTokensKey = `${TOKEN_PREFIXES.REFRESH}${userId}:tokens`;
    await redisService.hSet(userTokensKey, decoded.jti, now.toString());
    
    // Set expiry cho hash này bằng thời gian lớn nhất có thể
    await redisService.expire(userTokensKey, DEFAULT_REFRESH_TOKEN_TTL * 2);
    
  } catch (error) {
    logger.error(`Lỗi khi lưu refresh token: ${error.message}`);
    throw error;
  }
};

/**
 * @name verifyRefreshToken
 * @description Xác minh refresh token từ Redis
 * @param {string} refreshToken - Refresh token cần xác minh
 * @returns {Promise<object>} Payload từ token đã xác minh
 */
const verifyRefreshToken = async (refreshToken) => {
  logger.debug('Starting refresh token verification process');
  try {
    logger.debug('Decoding refresh token');
    const decoded = jwt.decode(refreshToken);
    logger.debug('Decoded refresh token:', decoded);
    
    if (!decoded || !decoded.jti) {
      logger.warn('Invalid refresh token format: missing jti');
      throw new Error('Invalid refresh token format: missing jti');
    }
    logger.debug(`Valid JTI found: ${decoded.jti}`);
    
    if (!decoded.user || (!decoded.user.id && !decoded.user._id)) {
      logger.warn('Invalid refresh token format: missing user ID');
      throw new Error('Invalid refresh token format: missing user ID');
    }
    
    const userId = decoded.user.id || decoded.user._id;
    logger.debug(`User ID extracted from token: ${userId}`);
    
    // Kiểm tra xem token có trong Redis không - use correct user ID path
    const tokenKey = `${TOKEN_PREFIXES.REFRESH}${userId}:${decoded.jti}`;
    logger.debug(`Looking up token in Redis with key: ${tokenKey}`);
    
    const tokenData = await redisService.get(tokenKey, true);
    logger.debug('Redis lookup result:', tokenData ? 'Token found' : 'Token not found');
    
    if (!tokenData || tokenData.token !== refreshToken) {
      logger.warn('Refresh token not found in Redis or token mismatch');
      throw new Error('Refresh token not found or revoked');
    }
    logger.debug('Token validated in Redis storage');
    
    const secret = decoded.isAdmin 
      ? process.env.ADMIN_REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET 
      : process.env.REFRESH_TOKEN_SECRET;
    
    logger.debug(`Verifying JWT signature with ${decoded.isAdmin ? 'admin' : 'standard'} secret`);
    const verified = jwt.verify(refreshToken, secret);
    logger.debug('JWT signature verification successful');
    
    return verified;
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Refresh token has expired', { token: refreshToken });
      throw new Error('Refresh token has expired');
    }
    logger.error(`Lỗi khi xác minh refresh token: ${error.message}`, {
      errorName: error.name,
      stack: error.stack,
      tokenFragment: refreshToken ? refreshToken.substring(0, 20) + '...' : 'undefined'
    });
    throw error;
  }
};

/**
 * @name revokeRefreshToken
 * @description Thu hồi một refresh token cụ thể
 * @param {string} refreshToken - Refresh token cần thu hồi
 * @returns {Promise<boolean>} Kết quả thu hồi
 */
const revokeRefreshToken = async (refreshToken) => {
  try {
    // Giải mã token không cần verify trước để lấy userId và jti
    const decoded = jwt.decode(refreshToken);
    
    // Check for valid structure and obtain user ID correctly
    if (!decoded || !decoded.jti) return false;
    
    const userId = decoded.user?.id || decoded.user?._id || decoded.id;
    if (!userId) return false;
    
    // Xóa token khỏi Redis
    const tokenKey = `${TOKEN_PREFIXES.REFRESH}${userId}:${decoded.jti}`;
    await redisService.del(tokenKey);
    
    // Xóa jti khỏi danh sách token của user
    const userTokensKey = `${TOKEN_PREFIXES.REFRESH}${userId}:tokens`;
    await redisService.hDel(userTokensKey, decoded.jti);
    
    return true;
  } catch (error) {
    logger.error(`Lỗi khi thu hồi refresh token: ${error.message}`);
    return false;
  }
};

/**
 * @name revokeAllUserRefreshTokens
 * @description Thu hồi tất cả refresh tokens của một người dùng
 * @param {string} userId - ID người dùng
 * @returns {Promise<boolean>} Kết quả thu hồi
 */
const revokeAllUserRefreshTokens = async (userId) => {
  try {
    // Lấy danh sách tất cả các jti tokens của user
    const userTokensKey = `${TOKEN_PREFIXES.REFRESH}${userId}:tokens`;
    const tokenList = await redisService.hGetAll(userTokensKey);
    
    if (!tokenList) return true; // Không có token nào
    
    // Thu hồi từng token
    const jtiList = Object.keys(tokenList);
    for (const jti of jtiList) {
      const tokenKey = `${TOKEN_PREFIXES.REFRESH}${userId}:${jti}`;
      await redisService.del(tokenKey);
    }
    
    // Xóa danh sách token
    await redisService.del(userTokensKey);
    
    return true;
  } catch (error) {
    logger.error(`Lỗi khi thu hồi tất cả refresh tokens: ${error.message}`);
    return false;
  }
};

/**
 * @name blacklistAccessToken
 * @description Thêm access token vào blacklist
 * @param {string} accessToken - Token cần blacklist
 * @returns {Promise<boolean>} Kết quả thêm vào blacklist
 */
const blacklistAccessToken = async (accessToken) => {
  try {
    // Giải mã token để lấy thời gian hết hạn
    let tokenInfo;
    try {
      // Thử với access token secret
      tokenInfo = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      // Nếu không được, thử với admin access token secret
      tokenInfo = jwt.verify(
        accessToken, 
        process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET
      );
    }
    
    if (!tokenInfo) return false;
    
    // Tính TTL dựa trên thời gian hết hạn
    const expiryTime = tokenInfo.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiryTime - now;
    
    if (ttl <= 0) return true; // Token đã hết hạn, không cần blacklist
    
    // Tạo hash của token để làm key
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    
    // Lưu vào blacklist với TTL bằng thời gian hết hạn còn lại
    await redisService.set(`${TOKEN_PREFIXES.BLACKLIST}${tokenHash}`, {
      jti: tokenInfo.jti || 'none',
      userId: tokenInfo.id,
      blacklistedAt: now
    }, ttl);
    
    return true;
  } catch (error) {
    logger.error(`Lỗi khi thêm token vào blacklist: ${error.message}`);
    return false;
  }
};

/**
 * @name isTokenBlacklisted
 * @description Kiểm tra xem token có trong blacklist không
 * @param {string} accessToken - Token cần kiểm tra
 * @returns {Promise<boolean>} Kết quả kiểm tra (true nếu đã bị blacklist)
 */
const isTokenBlacklisted = async (accessToken) => {
  try {
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    
    const result = await redisService.exists(`${TOKEN_PREFIXES.BLACKLIST}${tokenHash}`);
    return result;
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra token blacklist: ${error.message}`);
    return false;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  blacklistAccessToken,
  isTokenBlacklisted
};