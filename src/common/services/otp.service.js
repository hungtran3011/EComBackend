import crypto from 'crypto';
import { User } from '../../modules/user/user.schema.js';
import redisService from './redis.service.js';
import mailService from './mail.service.js';
import { config } from 'dotenv';
import {
  OtpEmailValidationSchema,
  OtpPhoneNumberValidationSchema
} from '../validators/otp.validator.js';

config();

/**
 * @name OTPService
 * @description Service quản lý mã OTP cho xác thực người dùng
 * Sử dụng Redis để lưu trữ và quản lý OTP với TTL (time-to-live) tự động
 */

// Cấu hình cố định
const OTP_EXPIRY_SECONDS = 600; // 10 phút
const OTP_LENGTH = 6;

/**
 * @name generateOTP
 * @description Tạo mã OTP ngẫu nhiên gồm 6 chữ số
 * @returns {string} Mã OTP được tạo
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * @name getOTPRedisKey
 * @description Tạo key Redis cho lưu trữ OTP
 * @param {string} userId - ID của người dùng
 * @param {string} purpose - Mục đích sử dụng OTP
 * @returns {string} Key Redis cho OTP
 * @private
 */
const getOTPRedisKey = (userId, purpose) => {
  return `otp:${userId}:${purpose}`;
};

/**
 * @name getRateLimitKey
 * @description Tạo key Redis cho giới hạn yêu cầu OTP
 * @param {string} identifier - Email hoặc số điện thoại
 * @returns {string} Key Redis cho rate limit
 * @private
 */
const getRateLimitKey = (identifier) => {
  return `otp-ratelimit:${identifier}`;
};

/**
 * @name saveOTP
 * @description Lưu mã OTP vào Redis với thời gian hết hạn
 * @param {string} userId - ID của người dùng
 * @param {string} purpose - Mục đích sử dụng OTP (login, register, reset_password)
 * @returns {Promise<string>} Mã OTP được tạo
 */
const saveOTP = async (userId, purpose) => {
  if (!userId) {
    throw new Error('ID người dùng là bắt buộc');
  }

  if (!purpose) {
    throw new Error('Mục đích sử dụng OTP là bắt buộc');
  }

  // Tạo khóa Redis cho OTP
  const redisKey = getOTPRedisKey(userId, purpose);

  // Tạo mã OTP mới
  const otp = generateOTP();

  try {
    // Lưu OTP vào Redis với TTL
    await redisService.set(redisKey, otp, OTP_EXPIRY_SECONDS);
    return otp;
  } catch (error) {
    console.error(`Lỗi khi lưu OTP vào Redis: ${error.message}`);
    throw new Error('Không thể lưu mã OTP');
  }
};

/**
 * @name verifyOTP
 * @description Xác minh mã OTP từ Redis
 * @param {string} userId - ID của người dùng
 * @param {string} otp - Mã OTP cần xác minh
 * @param {string} purpose - Mục đích sử dụng OTP
 * @returns {Promise<boolean>} Kết quả xác minh (true nếu hợp lệ, false nếu không hợp lệ)
 */
const verifyOTP = async (userId, otp, purpose) => {
  if (!userId || !otp || !purpose) {
    return false;
  }

  // Tạo khóa Redis cho OTP
  const redisKey = getOTPRedisKey(userId, purpose);

  try {
    // Lấy OTP từ Redis
    const storedOTP = await redisService.get(redisKey);

    // Kiểm tra OTP có tồn tại và khớp không
    if (!storedOTP || storedOTP !== otp) {
      return false;
    }

    // Xóa OTP sau khi xác minh thành công để tránh sử dụng lại
    await redisService.del(redisKey);

    return true;
  } catch (error) {
    console.error(`Lỗi khi xác minh OTP: ${error.message}`);
    return false;
  }
};

/**
 * @name sendOTPByEmail
 * @description Gửi mã OTP qua email
 * @param {string} email - Địa chỉ email nhận mã OTP
 * @param {string} otp - Mã OTP cần gửi
 * @param {string} purpose - Mục đích sử dụng OTP
 * @returns {Promise<boolean>} Kết quả gửi email (true nếu thành công)
 */
const sendOTPByEmail = async (email, otp, purpose) => {
  try {
    // Sử dụng mail service để gửi email OTP
    await mailService.sendOTPEmail(email, otp, purpose);
    return true;
  } catch (error) {
    console.error(`Lỗi khi gửi email OTP: ${error.message}`);
    throw new Error('Không thể gửi email chứa mã OTP');
  }
};

/**
 * @name sendOTPBySMS
 * @description Gửi mã OTP qua SMS (để triển khai trong tương lai)
 * @param {string} phoneNumber - Số điện thoại nhận mã OTP
 * @param {string} otp - Mã OTP cần gửi
 * @param {string} purpose - Mục đích sử dụng OTP
 * @returns {Promise<boolean>} Kết quả gửi SMS (true nếu thành công)
 */
const sendOTPBySMS = async (phoneNumber, otp, purpose) => {
  // TODO: Tích hợp với nhà cung cấp SMS thực tế
  console.log(`[DEBUG] Gửi OTP ${otp} đến số điện thoại ${phoneNumber} cho mục đích ${purpose}`);

  // Trả về true để giả lập thành công trong môi trường phát triển
  return true;
};

/**
 * @name sendLoginOTP
 * @description Tìm người dùng và gửi mã OTP đăng nhập
 * @param {Object} credentials - Thông tin đăng nhập cơ bản (email hoặc số điện thoại)
 * @returns {Promise<void>}
 */
const sendLoginOTP = async (credentials) => {
  const { email, phoneNumber } = credentials;

  if (!email && !phoneNumber) {
    throw new Error('Email hoặc số điện thoại là bắt buộc');
  }
  try {
    const validEmail = OtpEmailValidationSchema.parse(email);
    const validPhone = OtpPhoneNumberValidationSchema.parse(phoneNumber);
    // Tìm người dùng dựa trên email hoặc số điện thoại
    const user = await User.findOne({
      $or: [
        { email: validEmail || '' },
        { phoneNumber: validPhone || '' }
      ],
      isRegistered: true
    });


    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Tạo và lưu mã OTP
    const otp = await saveOTP(user._id.toString(), 'login');

    // Gửi OTP qua email hoặc SMS tùy thuộc vào thông tin được cung cấp
    if (email && user.email) {
      await sendOTPByEmail(user.email, otp, 'login');
    } else if (phoneNumber && user.phoneNumber) {
      await sendOTPBySMS(user.phoneNumber, otp, 'login');
    } else {
      throw new Error('Không có phương thức liên hệ phù hợp');
    }
  }
  catch (error) {
    console.error(`Lỗi khi gửi mã OTP đăng nhập: ${error.message}`);
    throw new Error('Không thể gửi mã OTP đăng nhập');
  }
};

/**
 * @name checkRateLimit
 * @description Kiểm tra giới hạn yêu cầu OTP
 * @param {string} identifier - Email hoặc số điện thoại
 * @param {number} maxAttempts - Số lần yêu cầu tối đa (mặc định: 3)
 * @param {number} windowSeconds - Khoảng thời gian giới hạn tính bằng giây (mặc định: 10 phút)
 * @returns {Promise<boolean>} True nếu chưa vượt quá giới hạn
 */
const checkRateLimit = async (identifier, maxAttempts = 3, windowSeconds = 600) => {
  const key = getRateLimitKey(identifier);

  try {
    // Lấy số lần yêu cầu hiện tại
    const attempts = await redisService.get(key) || 0;

    // Nếu vượt quá giới hạn
    if (parseInt(attempts) >= maxAttempts) {
      return false;
    }

    // Tăng số lần yêu cầu
    await redisService.incr(key);

    // Đặt thời gian sống nếu là lần đầu tiên
    if (attempts === 0) {
      await redisService.expire(key, windowSeconds);
    }

    return true;
  } catch (error) {
    console.error(`Lỗi khi kiểm tra giới hạn yêu cầu OTP: ${error.message}`);
    // Nếu có lỗi, cho phép yêu cầu để tránh block người dùng
    return true;
  }
};

/**
 * @name sendPasswordResetOTP
 * @description Gửi mã OTP để đặt lại mật khẩu
 * @param {string} email - Email của người dùng
 * @returns {Promise<void>}
 */
const sendPasswordResetOTP = async (email) => {
  if (!email) {
    throw new Error('Email là bắt buộc');
  }

  try {
    const validEmail = OtpEmailValidationSchema.parse(email);

    // Tìm người dùng
    const user = await User.findOne({ email: validEmail, isRegistered: true });
    if (!user) {
      throw new Error('Không tìm thấy người dùng với email này');
    }

    // Tạo và lưu mã OTP
    const otp = await saveOTP(user._id.toString(), 'reset_password');

    // Gửi OTP qua email
    await sendOTPByEmail(email, otp, 'reset_password');
  }
  catch (error) {
    console.error(`Lỗi khi gửi mã OTP đặt lại mật khẩu: ${error.message}`);
    throw new Error('Không thể gửi mã OTP đặt lại mật khẩu');
  }
};

/**
 * @name resetPassword
 * @description Đặt lại mật khẩu sau khi xác minh OTP
 * @param {string} email - Email của người dùng
 * @param {string} otp - Mã OTP xác minh
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Promise<boolean>} Kết quả đặt lại mật khẩu
 */
const resetPassword = async (email, otp, newPassword) => {
  // Tìm người dùng
  const validEmail = OtpEmailValidationSchema.parse(email);
  const user = await User.findOne({ validEmail, isRegistered: true });
  if (!user) {
    throw new Error('Không tìm thấy người dùng');
  }

  // Xác minh OTP
  const isValidOTP = await verifyOTP(user._id.toString(), otp, 'reset_password');
  if (!isValidOTP) {
    return false;
  }

  try {
    // Mã hóa mật khẩu mới
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    return true;
  } catch (error) {
    console.error(`Lỗi khi đặt lại mật khẩu: ${error.message}`);
    throw new Error('Không thể đặt lại mật khẩu');
  }
};

// Xuất tất cả các hàm
export default {
  generateOTP,
  saveOTP,
  verifyOTP,
  sendOTPByEmail,
  sendOTPBySMS,
  sendLoginOTP,
  checkRateLimit,
  sendPasswordResetOTP,
  resetPassword
};