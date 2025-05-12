import { createClient } from 'redis';
import { config } from 'dotenv';
import { debugLogger } from '../middlewares/debug-logger.js';

config();
const logger = debugLogger('redis-service');

/**
 * @name RedisService
 * @author hungtran3011
 * @description Service quản lý kết nối và tương tác với Redis
 * Cung cấp các hàm để lưu trữ, truy xuất và xóa dữ liệu từ Redis
 */

// Biến cục bộ cho module để theo dõi trạng thái kết nối
let client = null;
let isReady = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectInterval = 5000; // 5 giây

/**
 * @name initializeClient
 * @description Khởi tạo kết nối đến Redis server
 * @private
 */
const initializeClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: reconnectStrategy
    }
  });

  // Xử lý các sự kiện kết nối
  client.on('connect', () => {
    logger.info('Đang kết nối đến Redis...');
  });

  client.on('ready', () => {
    logger.info('Đã kết nối thành công đến Redis!');
    isReady = true;
    reconnectAttempts = 0;
  });

  client.on('error', (err) => {
    logger.error('Lỗi Redis:', err);
    isReady = false;
  });

  client.on('end', () => {
    logger.info('Đã ngắt kết nối từ Redis');
    isReady = false;
  });

  // Kết nối đến Redis
  connect();
};

/**
 * @name reconnectStrategy
 * @description Chiến lược kết nối lại khi mất kết nối
 * @param {Object} retries - Thông tin về số lần thử kết nối lại
 * @returns {number|Error} Thời gian chờ trước khi kết nối lại hoặc lỗi khi vượt quá số lần thử
 * @private
 */
const reconnectStrategy = (retries) => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    logger.error(`Đã vượt quá số lần thử kết nối lại (${maxReconnectAttempts}). Dừng kết nối Redis.`);
    return new Error('Vượt quá số lần thử kết nối lại Redis');
  }
  
  reconnectAttempts += 1;
  logger.info(`Đang thử kết nối lại Redis... (Lần thử ${reconnectAttempts}/${maxReconnectAttempts})`);
  
  // Tăng thời gian chờ theo cấp số nhân, nhưng không quá 30 giây
  const delay = Math.min(Math.pow(2, retries) * 1000, 30000);
  return delay;
};

/**
 * @name connect
 * @description Kết nối đến Redis server
 * @returns {Promise<void>}
 */
const connect = async () => {
  if (!client || !client.isOpen) {
    try {
      await client.connect();
    } catch (error) {
      logger.error('Không thể kết nối đến Redis:', error);
    }
  }
};

/**
 * @name disconnect
 * @description Ngắt kết nối từ Redis server
 * @returns {Promise<void>}
 */
const disconnect = async () => {
  if (client && client.isOpen) {
    try {
      await client.quit();
      logger.info('Đã đóng kết nối Redis một cách an toàn');
    } catch (error) {
      logger.error('Lỗi khi đóng kết nối Redis:', error);
    }
  }
};

/**
 * @name isConnected
 * @description Kiểm tra xem service đã kết nối đến Redis chưa
 * @returns {boolean} Trạng thái kết nối
 */
const isConnected = () => {
  return client && isReady && client.isOpen;
};

/**
 * @name ensureConnection
 * @description Đảm bảo rằng có kết nối đến Redis
 * @returns {Promise<void>}
 * @private
 */
const ensureConnection = async () => {
  if (!isConnected()) {
    await connect();
    if (!isReady) {
      throw new Error('Redis không sẵn sàng');
    }
  }
};

/**
 * @name set
 * @description Lưu trữ giá trị vào Redis với khóa cụ thể
 * @param {string} key - Khóa để lưu trữ giá trị
 * @param {string|Object} value - Giá trị cần lưu trữ (đối tượng sẽ được chuyển đổi sang JSON)
 * @param {number} [expiry] - Thời gian hết hạn tính bằng giây (không bắt buộc)
 * @returns {Promise<string>} Kết quả từ Redis
 */
const set = async (key, value, expiry = null) => {
  try {
    await ensureConnection();

    // Chuyển đổi value sang chuỗi nếu là đối tượng
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Thiết lập với hoặc không có thời gian hết hạn
    if (expiry) {
      return await client.set(key, stringValue, { EX: expiry });
    }
    
    return await client.set(key, stringValue);
  } catch (error) {
    logger.error("Lỗi khi lưu khóa %s", key, error);
    throw error;
  }
};

/**
 * @name get
 * @description Lấy giá trị từ Redis theo khóa
 * @param {string} key - Khóa để tìm giá trị
 * @param {boolean} [parse=false] - Có phân tích cú pháp JSON hay không
 * @returns {Promise<any>} Giá trị được lưu trữ hoặc null nếu không tìm thấy
 */
const get = async (key, parse = false) => {
  try {
    await ensureConnection();

    const value = await client.get(key);
    
    if (value && parse) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Nếu không thể phân tích cú pháp JSON, trả về giá trị nguyên bản
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`Lỗi khi lấy khóa %s:`, key, error);
    throw error;
  }
};

/**
 * @name del
 * @description Xóa một hoặc nhiều khóa khỏi Redis
 * @param {...string} keys - Các khóa cần xóa
 * @returns {Promise<number>} Số lượng khóa đã xóa
 */
const del = async (...keys) => {
  try {
    await ensureConnection();

    return await client.del(keys);
  } catch (error) {
    logger.error("Lỗi khi xóa khóa %s:", keys.join(", "), error);
    throw error;
  }
};

/**
 * @name exists
 * @description Kiểm tra xem khóa có tồn tại trong Redis hay không
 * @param {string} key - Khóa cần kiểm tra
 * @returns {Promise<boolean>} True nếu khóa tồn tại, ngược lại là false
 */
const exists = async (key) => {
  try {
    await ensureConnection();

    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra tồn tại khóa %s:`, key, error);
    throw error;
  }
};

/**
 * @name expire
 * @description Thiết lập thời gian hết hạn cho khóa
 * @param {string} key - Khóa cần thiết lập thời gian hết hạn
 * @param {number} seconds - Thời gian tính bằng giây
 * @returns {Promise<boolean>} True nếu thành công, ngược lại là false
 */
const expire = async (key, seconds) => {
  try {
    await ensureConnection();

    const result = await client.expire(key, seconds);
    return result === 1;
  } catch (error) {
    logger.error(`Lỗi khi thiết lập hết hạn khóa %s:`, key, error);
    throw error;
  }
};

/**
 * @name incr
 * @description Tăng giá trị của khóa lên 1
 * @param {string} key - Khóa cần tăng giá trị
 * @returns {Promise<number>} Giá trị mới sau khi tăng
 */
const incr = async (key) => {
  try {
    await ensureConnection();

    return await client.incr(key);
  } catch (error) {
    logger.error(`Lỗi khi tăng giá trị khóa %s:`, key, error);
    throw error;
  }
};

/**
 * @name hSet
 * @description Thiết lập giá trị của field trong hash
 * @param {string} key - Khóa của hash
 * @param {string} field - Trường trong hash
 * @param {string|Object} value - Giá trị cần thiết lập
 * @returns {Promise<number>} 1 nếu là trường mới, 0 nếu trường đã tồn tại
 */
const hSet = async (key, field, value) => {
  try {
    await ensureConnection();

    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return await client.hSet(key, field, stringValue);
  } catch (error) {
    logger.error(`Lỗi khi thiết lập trường %s trong hash %s:`, field, key, error);
    throw error;
  }
};

/**
 * @name hGet
 * @description Lấy giá trị của field từ hash
 * @param {string} key - Khóa của hash
 * @param {string} field - Trường cần lấy giá trị
 * @param {boolean} [parse=false] - Có phân tích cú pháp JSON hay không
 * @returns {Promise<any>} Giá trị của trường hoặc null nếu không tồn tại
 */
const hGet = async (key, field, parse = false) => {
  try {
    await ensureConnection();

    const value = await client.hGet(key, field);
    
    if (value && parse) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`Lỗi khi lấy trường %s từ hash %s:`, field, key, error);
    throw error;
  }
};

/**
 * @name flushDb
 * @description Xóa tất cả các khóa trong cơ sở dữ liệu hiện tại
 * @returns {Promise<string>} OK nếu thành công
 */
const flushDb = async () => {
  try {
    await ensureConnection();

    return await client.flushDb();
  } catch (error) {
    logger.error('Lỗi khi xóa toàn bộ dữ liệu Redis:', error);
    throw error;
  }
};

/**
 * @name hGetAll
 * @description Lấy tất cả các cặp field-value từ hash
 * @param {string} key - Khóa của hash
 * @param {boolean} [parseValues=false] - Phân tích các giá trị như JSON
 * @returns {Promise<Object>} Đối tượng chứa tất cả cặp field-value
 */
const hGetAll = async (key, parseValues = false) => {
  try {
    await ensureConnection();

    const result = await client.hGetAll(key);
    
    if (parseValues && result) {
      // Parse các giá trị là JSON nếu có thể
      Object.keys(result).forEach(field => {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          // Giữ nguyên giá trị nếu không thể parse
        }
      });
    }
    
    return result || {};
  } catch (error) {
    logger.error(`Lỗi khi lấy tất cả từ hash %s:`, key, error);
    throw error;
  }
};

/**
 * @name hDel
 * @description Xóa một hoặc nhiều field từ hash
 * @param {string} key - Khóa của hash
 * @param {...string} fields - Các field cần xóa
 * @returns {Promise<number>} Số field đã xóa thành công
 */
const hDel = async (key, ...fields) => {
  try {
    await ensureConnection();

    return await client.hDel(key, ...fields);
  } catch (error) {
    logger.error(`Lỗi khi xóa field từ hash %s:`, key, error);
    throw error;
  }
};

// Khởi tạo client Redis ngay khi module được import
initializeClient();

// Xuất các hàm
export default {
  set,
  get,
  del,
  exists,
  expire,
  incr,
  hSet,
  hGet,
  hGetAll,
  hDel,
  flushDb,
  connect,
  disconnect,
  isConnected
};