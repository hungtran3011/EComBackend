import { User } from "../user/user.schema.js";
import bcrypt from "bcrypt";
import tokenService from "../../common/services/token.service.js";
import { UserService } from "../user/user.service.js";
import OTPService from "../../common/services/otp.service.js";
import { OtpPhoneNumberValidationSchema, OtpEmailValidationSchema } from "../../common/validators/otp.validator.js";

// Cấu hình cookie
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
};

/**
 * Đăng ký người dùng mới
 * @param {object} userData - Dữ liệu người dùng
 * @returns {Promise<object>} Thông tin người dùng đã đăng ký và tokens
 */
const registerUser = async (userData) => {
  const { name, email, phoneNumber, password, address } = userData;
  
  // Kiểm tra người dùng đã tồn tại chưa
  const existingUser = await UserService.findUserByEmailOrPhone(email, phoneNumber);
  
  if (existingUser) {
    throw { status: 400, message: "Người dùng đã tồn tại" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = new User({
    name,
    email,
    phoneNumber,
    password: hashedPassword,
    address,
    isRegistered: true,
    role: "customer",
  });

  await newUser.save();
  
  // Tạo token ngay sau khi đăng ký
  const accessToken = tokenService.generateAccessToken({
    id: newUser._id,
    role: newUser.role,
    avatarUrl: newUser.avatarUrl,
    email: newUser.email,
  }, false);
  const refreshToken = tokenService.generateRefreshToken({
    id: newUser._id,
    role: newUser.role,
    avatarUrl: newUser.avatarUrl,
    email: newUser.email,
  }, false);
  
  // Lưu refresh token vào Redis
  await tokenService.saveRefreshToken(newUser._id.toString(), refreshToken);
  
  const userResponse = newUser.toObject();
  delete userResponse.password;
    
  return {
    user: userResponse,
    accessToken,
    refreshToken, // Chỉ trả về để controller có thể thiết lập cookie
    cookieConfig: COOKIE_CONFIG
  };
};

/**
 * Đăng nhập người dùng
 * @param {object} credentials - Thông tin đăng nhập
 * @returns {Promise<object>} Access token và thông tin người dùng
 */
const signIn = async (credentials) => {
  const { email, phoneNumber, password } = credentials;
  
  // Sử dụng findUserByEmailOrPhone từ UserService
  const user = await UserService.findUserByEmailOrPhone(email, phoneNumber);

  if (!user) {
    throw { status: 404, message: "Không tìm thấy người dùng" };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw { status: 401, message: "Mật khẩu không chính xác" };
  }

  const accessToken = tokenService.generateAccessToken({
    id: user._id,
    role: user.role,
    avatarUrl: user.avatarUrl,
    email: user.email,
  }, false);
  const refreshToken = tokenService.generateRefreshToken({
    id: user._id,
    role: user.role,
    avatarUrl: user.avatarUrl,
    email: user.email,
  }, false);
  
  // Lưu refresh token vào Redis
  await tokenService.saveRefreshToken(user._id.toString(), refreshToken);
  
  return { 
    accessToken,
    refreshToken, // Chỉ trả về để controller có thể thiết lập cookie
    cookieConfig: COOKIE_CONFIG,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role
    } 
  };
};

/**
 * Đăng nhập bằng OTP
 * @param {object} credentials - Thông tin đăng nhập
 * @returns {Promise<object>} Access token và thông tin người dùng
 */
const signInWithOTP = async (credentials) => {
  const { email, phoneNumber, otp } = credentials;
  const user = await User.findOne({ $or: [{ email }, { phoneNumber }], isRegistered: true });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const isValidOTP = await OTPService.verifyOTP(user._id, otp, "login");
  if (!isValidOTP) {
    throw { status: 401, message: "Invalid or expired OTP" };
  }

  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user);
  
  // Lưu refresh token vào Redis
  await tokenService.saveRefreshToken(user._id.toString(), refreshToken);
  
  return { 
    accessToken,
    refreshToken, // Chỉ trả về để controller có thể thiết lập cookie
    cookieConfig: COOKIE_CONFIG,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    }
  };
};

/**
 * Gửi OTP để đăng nhập
 * @param {object} credentials - Thông tin người dùng
 * @returns {Promise<void>}
 */
const sendLoginOTP = async (credentials) => {
  const { email, phoneNumber } = credentials;
  const user = await User.findOne({ $or: [{ email }, { phoneNumber }], isRegistered: true });

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const otp = await OTPService.saveOTP(user._id, "login");
  await OTPService.sendOTPByEmail(user.email, otp, "login");
};

/**
 * Xử lý refresh token
 * @param {string} refreshToken - Refresh token từ cookie
 * @returns {Promise<object>} Access token mới
 */
const handleRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw { status: 401, message: "Refresh token là bắt buộc" };
  }

  try {
    // Xác minh refresh token từ Redis
    const decoded = await tokenService.verifyRefreshToken(refreshToken);
    
    // Tạo access token mới
    const accessToken = tokenService.generateAccessToken(decoded.id);
    
    return { accessToken };
  } catch (error) {
    throw { status: 403, message: "Refresh token không hợp lệ hoặc đã hết hạn" };
  }
};

const handleAdminRefreshToken = async (refreshToken) => {
  return handleRefreshToken(refreshToken);
}

/**
 * Đăng xuất người dùng
 * @param {string} userId - ID người dùng
 * @param {string} accessToken - Access token hiện tại
 * @param {string} refreshToken - Refresh token từ cookie
 * @returns {Promise<void>}
 */
const handleLogout = async (userId, accessToken, refreshToken) => {
  try {
    // Thêm access token vào blacklist
    if (accessToken) {
      await tokenService.blacklistAccessToken(accessToken);
    }
    
    // Thu hồi refresh token cụ thể nếu được cung cấp
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
      return;
    }
    
    // Nếu không có refresh token cụ thể, thu hồi tất cả refresh tokens của user
    if (userId) {
      await tokenService.revokeAllUserRefreshTokens(userId);
    }
  } catch (error) {
    throw { status: 500, message: "Lỗi khi đăng xuất" };
  }
};

/**
 * Đăng nhập với quyền admin
 * @param {object} credentials - Thông tin đăng nhập admin
 * @param {object} headers - HTTP headers
 * @returns {Promise<object>} Access token và thông tin admin
 */
const adminSignIn = async (credentials, headers) => {
  try {
    const { email, password } = credentials;

    // if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    //   throw { status: 401, message: "Invalid credentials" };
    // }

    // const clientIP = headers["x-forwarded-for"] || headers["socket.remoteAddress"];
    // const allowedAdminIPs = process.env.ADMIN_ALLOWED_IPS?.split(",") || [];

    // if (allowedAdminIPs.length > 0 && !allowedAdminIPs.includes(clientIP)) {
    //   throw { status: 403, message: "Access denied from this location" };
    // }
    
    const validEmail = OtpEmailValidationSchema.parse(email);
    console.log("Valid email:", validEmail); 
    // const admin = await User.findOne({ validEmail, role: "admin" });
    const admin = await UserService.findAdminByEmailOrPhone(validEmail, null);
    console.log("Admin:", admin);
    if (!admin) {
      console.error("Admin not found");
      throw { status: 401, message: "Invalid credentials" };
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw { status: 401, message: "Invalid credentials" };
    }

    // Tạo token với flag isAdmin
    const adminAccessToken = tokenService.generateAccessToken({
      id: admin._id,
      role: admin.role,
      avatarUrl: admin.avatarUrl,
      email: admin.email,
    }, true);
    const adminRefreshToken = tokenService.generateRefreshToken({
      id: admin._id,
      role: admin.role,
      avatarUrl: admin.avatarUrl,
      email: admin.email,
    }, true);

    // Lưu refresh token vào Redis
    await tokenService.saveRefreshToken(admin._id.toString(), adminRefreshToken, true);

    return { 
      accessToken: adminAccessToken, 
      refreshToken: adminRefreshToken,
      cookieConfig: {
        ...COOKIE_CONFIG,
        maxAge: 4 * 60 * 60 * 1000 // 4 giờ cho admin
      },
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      } 
    };
  } catch (error) {
    if (error.status) {
      throw error; // Re-throw errors that already have status
    } else if (error.name === 'ZodError') {
      throw { status: 400, message: "Invalid email format" };
    } else {
      console.error("Admin sign-in error:", error);
      throw { status: 500, message: "Internal server error during authentication" };
    }
  }
};

export default {
  registerUser,
  signIn,
  signInWithOTP,
  sendLoginOTP,
  handleRefreshToken,
  handleAdminRefreshToken,
  handleLogout,
  adminSignIn,
  COOKIE_CONFIG
};
