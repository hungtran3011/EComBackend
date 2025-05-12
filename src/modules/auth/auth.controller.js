import AuthService from "./auth.service.js";
import otpService from '../../common/services/otp.service.js';
import mailService from '../../common/services/mail.service.js';
import { validatePassword } from "../../common/validators/password.validator.js";
import { debugLogger } from "../../common/middlewares/debug-logger.js";

const logger = debugLogger("auth-controller");


/**
 * @name registerUser
 * @author hungtran3011
 * @description Đăng ký người dùng mới, cho phép sử dụng số điện thoại hoặc email để đăng nhập
 * Xác thực bằng mật khẩu, sau này có thể thêm xác thực 2 yếu tố như mail hay authenticate app
 * Có thể thêm các thông tin khác như địa chỉ
 * @summary Đăng ký người dùng mới
 * 
 */
const registerUser = async (req, res) => {
  try {
    // Debug the request body only in development environment
    if (process.env.NODE_ENV === 'development') {
      // Remove sensitive data before logging
      const { password, phoneNumber, email, ...restBody } = req.body;
      const sanitizedBody = {
        ...restBody,
        password: '[REDACTED]',
        phoneNumber: '[REDACTED]',
        email: '[REDACTED]',
      };
      logger.debug("Register request body:", JSON.stringify(sanitizedBody));
    }
    // Validate required fields before passing to service
    const { name, email, phoneNumber, password } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        message: "Tên là trường bắt buộc",
        field: "name"
      });
    }
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ 
        message: "Email hoặc số điện thoại là bắt buộc",
        field: "email/phoneNumber"
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        message: "Mật khẩu là trường bắt buộc",
        field: "password"
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Mật khẩu không hợp lệ",
        field: "password"
      })
    }
    
    const { user, accessToken, refreshToken, cookieConfig } = await AuthService.registerUser(req.body);
    
    // Thiết lập refreshToken làm HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieConfig);
    
    // Gửi email chào mừng
    try {
      await mailService.sendWelcomeEmail(user.email, user.name);
    } catch (mailError) {
      // Log lỗi nhưng không làm gián đoạn việc đăng ký
      logger.error('Error sending welcome email:', mailError);
    }
    
    // Chỉ trả về accessToken và thông tin user
    res.status(201).json({ user, accessToken });
  } catch (e) {
    logger.error('Register error:', e);
    
    // Provide clear error message for Zod validation failures
    if (e.message && e.message.includes('invalid_type')) {
      try {
        const validationErrors = JSON.parse(e.message);
        const fieldErrors = validationErrors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ",
          errors: fieldErrors
        });
      } catch (parseError) {
        // If parsing fails, fallback to original error
      }
    }
    
    // Use status from error if available, otherwise default to 500
    res.status(e.status || 500).json({ 
      message: e.message || "Đã xảy ra lỗi khi đăng ký"
    });
  }
};


/**
 * @name signIn
 * @author hungtran3011
 * @description Đăng nhập người dùng bằng email/số điện thoại và mật khẩu
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} [req.body.email] - Email của người dùng
 * @param {string} [req.body.phoneNumber] - Số điện thoại của người dùng
 * @param {string} req.body.password - Mật khẩu của người dùng
 * @param {object} res - Express response object
 * @returns {Promise<void>} Promise không có giá trị trả về
 */
const signIn = async (req, res) => {
  try {
    // Nhận accessToken, refreshToken, và user từ service
    const { accessToken, refreshToken, cookieConfig, user } = await AuthService.signIn(req.body);
    
    // Thiết lập refreshToken làm HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieConfig);
    
    // Chỉ trả về access token và thông tin người dùng
    res.status(200).json({ accessToken, user });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};



/**
 * @name handleRefreshToken
 * @author hungtran3011
 * @description Làm mới access token bằng refresh token. 
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} req.body.refreshToken - Refresh token để tạo access token mới
 * @param {object} res - Express response object
 * @returns {void}
 */
const handleRefreshToken = async (req, res) => {
  try {
    // Lấy refreshToken từ cookie thay vì từ body
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token là bắt buộc" });
    }
    
    const { accessToken } = await AuthService.handleRefreshToken(refreshToken);
    res.status(200).json({ accessToken });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
}

const handleAdminRefreshToken = async (req, res) => {
  try {
    // Lấy refreshToken từ cookie thay vì từ body
    const refreshToken = req.cookies.adminRefreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token là bắt buộc" });
    }
    
    const { accessToken } = await AuthService.handleAdminRefreshToken(refreshToken);
    res.status(200).json({ accessToken });
  } catch (e) {
    logger.error('Admin refresh token error:', e);
    res.status(e.status || 500).json({ message: e.message });
  }
}


/**
 * @name handleLogout
 * @author hungtran3011
 * @description Đăng xuất người dùng bằng cách xóa refresh token
 * @param {object} req - Express request object
 * @param {object} req.params - Route parameters
 * @param {string} req.params.id - ID người dùng cần đăng xuất
 * @param {object} res - Express response object
 * @returns {void}
 */
const handleLogout = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const accessToken = req.token;
    const refreshToken = req.cookies?.refreshToken || req.cookies?.adminRefreshToken;
    
    await AuthService.handleLogout(userId, accessToken, refreshToken);
    
    // Xóa cookie refreshToken
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.clearCookie('adminRefreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
}


const adminSignIn = async (req, res) => {
  try {
    const { accessToken, refreshToken, cookieConfig, user } = await AuthService.adminSignIn(req.body, req.headers);
    
    // Thiết lập refreshToken làm HTTP-only cookie với thời gian ngắn hơn
    res.cookie('adminRefreshToken', refreshToken, cookieConfig);
    
    // Chỉ trả về accessToken và thông tin admin
    res.status(200).json({ accessToken, user });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};


/**
 * @name sendPasswordResetOTP
 * @author hungtran3011
 * @description Gửi mã OTP để đặt lại mật khẩu đến email người dùng
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} req.body.email - Email người dùng cần đặt lại mật khẩu
 * @param {object} res - Express response object
 * @returns {Promise<void>} Promise không có giá trị trả về
 * @throws {Error} Nếu không tìm thấy người dùng hoặc có lỗi khi gửi OTP
 */
const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }
    
    // Kiểm tra rate limit
    const withinLimit = await otpService.checkRateLimit(email, 2, 1800); // 2 lần trong 30 phút
    if (!withinLimit) {
      return res.status(429).json({ 
        message: "Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau."
      });
    }
    
    await otpService.sendPasswordResetOTP(email);
    
    res.status(200).json({
      message: "Mã OTP đặt lại mật khẩu đã được gửi",
      expiresIn: 600 // 10 phút
    });
  } catch (error) {
    if (error.message === "Không tìm thấy người dùng với email này") {
      // Lưu ý: Với vấn đề bảo mật, bạn có thể muốn trả về phản hồi thành công
      // ngay cả khi người dùng không tồn tại để tránh việc liệt kê tài khoản
      return res.status(200).json({ 
        message: "Nếu email tồn tại, mã OTP sẽ được gửi"
      });
    }
    
    logger.error(`Lỗi khi gửi OTP đặt lại mật khẩu: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi gửi mã OTP" });
  }
};


/**
 * @name resetPassword
 * @author hungtran3011
 * @description Đặt lại mật khẩu người dùng sử dụng OTP xác thực
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} req.body.email - Email của người dùng
 * @param {string} req.body.otp - Mã OTP đã nhận được qua email
 * @param {string} req.body.newPassword - Mật khẩu mới (ít nhất 6 ký tự)
 * @param {object} res - Express response object
 * @returns {Promise<void>} Promise không có giá trị trả về
 * @throws {Error} Nếu OTP không hợp lệ hoặc có lỗi khi đặt lại mật khẩu
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: "Email, mã OTP và mật khẩu mới là bắt buộc" 
      });
    }
    
    // Kiểm tra mật khẩu hợp lệ
    if (validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Mật khẩu không hợp lệ",
        field: "newPassword"
      });
    }
    
    // Thực hiện đặt lại mật khẩu
    const success = await otpService.resetPassword(email, otp, newPassword);
    
    if (!success) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }
    
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    logger.error(`Lỗi đặt lại mật khẩu: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi đặt lại mật khẩu" });
  }
};


/**
 * @name sendLoginOTP
 * @author hungtran3011
 * @description Gửi mã OTP để đăng nhập vào tài khoản
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} [req.body.email] - Email của người dùng
 * @param {string} [req.body.phoneNumber] - Số điện thoại của người dùng
 * @param {object} res - Express response object
 * @returns {Promise<void>} Promise không có giá trị trả về
 * @throws {Error} Nếu không tìm thấy người dùng hoặc có lỗi khi gửi OTP
 */
const sendLoginOTP = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Email hoặc số điện thoại là bắt buộc" });
    }
    
    const identifier = email || phoneNumber;
    
    // Kiểm tra rate limit
    const withinLimit = await otpService.checkRateLimit(identifier);
    if (!withinLimit) {
      return res.status(429).json({ 
        message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút."
      });
    }
    
    await otpService.sendLoginOTP(req.body);
    
    res.status(200).json({
      message: "Mã OTP đã được gửi thành công",
      expiresIn: 600 // 10 phút
    });
  } catch (error) {
    if (error.message === "Không tìm thấy người dùng") {
      return res.status(404).json({ message: error.message });
    }
    
    logger.error(`Lỗi khi gửi OTP: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi gửi mã OTP" });
  }
};


/**
 * @name signInWithOTP
 * @author hungtran3011
 * @description Đăng nhập người dùng bằng mã OTP thay vì mật khẩu
 * @param {object} req - Express request object
 * @param {object} req.body - Request body
 * @param {string} [req.body.email] - Email của người dùng
 * @param {string} [req.body.phoneNumber] - Số điện thoại của người dùng
 * @param {string} req.body.otp - Mã OTP để xác thực
 * @param {object} res - Express response object
 * @returns {Promise<void>} Promise không có giá trị trả về
 * @throws {Error} Nếu không tìm thấy người dùng, OTP không hợp lệ hoặc có lỗi khác
 */
const signInWithOTP = async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    
    if ((!email && !phoneNumber) || !otp) {
      return res.status(400).json({ 
        message: "Email/số điện thoại và mã OTP là bắt buộc" 
      });
    }
    
    // Tìm người dùng và xác nhận OTP
    const { accessToken, refreshToken, cookieConfig, user } = await AuthService.signInWithOTP(req.body);
    
    // Thiết lập refreshToken làm HTTP-only cookie
    res.cookie('refreshToken', refreshToken, cookieConfig);
    
    // Chỉ trả về accessToken và thông tin người dùng
    res.status(200).json({
      accessToken,
      user
    });
  } catch (error) {
    logger.error(`Lỗi đăng nhập với OTP: ${error.message}`);
    res.status(error.status || 500).json({ message: error.message });
  }
};

const AuthControllers = {
  registerUser,
  signIn,
  sendLoginOTP,
  signInWithOTP,
  handleRefreshToken,
  handleAdminRefreshToken,
  handleLogout,
  adminSignIn,
  sendPasswordResetOTP,
  resetPassword
};

export default AuthControllers;

