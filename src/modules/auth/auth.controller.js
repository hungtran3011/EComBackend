import AuthService from "./auth.service.js";
import otpService from '../../common/services/otp.service.js';
import mailService from '../../common/services/mail.service.js';
import { validatePassword } from "../../common/validators/password.validator.js";

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Đăng ký một tài khoản người dùng mới
 *     description: 
 *        Cho phép người dùng đăng ký tài khoản mới với email và/hoặc số điện thoại. \
 *        Chúng tôi sẽ kiểm tra xem bạn đã đăng ký chưa - nếu có thì xin lỗi, bạn không thể đăng ký lại đâu! \
 *        Nếu chưa, chúng tôi sẽ tạo tài khoản mới cho bạn và trả về thông tin chi tiết. \
 *        Đừng lo, chúng tôi không lưu trữ mật khẩu của bạn dưới dạng văn bản thuần túy đâu - tất cả đều được mã hóa an toàn!
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên đầy đủ của bạn (không phải nickname nhé!)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email hợp lệ để chúng tôi có thể liên lạc với bạn
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại của bạn (để chúng tôi gọi khi đơn hàng đến nơi)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mạnh (đừng dùng "123456" nhé, chúng tôi sẽ buồn lắm!)
 *               address:
 *                 type: object
 *                 description: Địa chỉ giao hàng của bạn
 *                 properties:
 *                   homeNumber:
 *                     type: string
 *                     description: Số nhà/căn hộ
 *                   street:
 *                     type: string
 *                     description: Tên đường
 *                   district:
 *                     type: string
 *                     description: Quận/huyện
 *                   city:
 *                     type: string
 *                     description: Thành phố
 *                   state:
 *                     type: string
 *                     description: Bang (nếu có)
 *                   province:
 *                     type: string
 *                     description: Tỉnh
 *     responses:
 *       201:
 *         description: Đăng ký thành công! Chào mừng bạn đến với gia đình chúng tôi!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 address:
 *                   type: object
 *                 isRegistered:
 *                   type: boolean
 * 
 *       400:
 *         description: Rất tiếc! Người dùng này đã tồn tại rồi. Có phải bạn đã quên mật khẩu?
 *       500:
 *         description: Ôi không! Máy chủ gặp lỗi. Hãy thử lại sau nhé!
 */
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
      console.log('Register request body:', JSON.stringify(sanitizedBody));
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
      console.error('Error sending welcome email:', mailError);
    }
    
    // Chỉ trả về accessToken và thông tin user
    res.status(201).json({ user, accessToken });
  } catch (e) {
    console.error('Register error:', e);
    
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
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Đăng nhập vào tài khoản của bạn
 *     description: >
 *       Đăng nhập vào hệ thống với email hoặc số điện thoại và mật khẩu của bạn. 
 *       Sau khi đăng nhập thành công, bạn sẽ nhận được access token và refresh token. 
 *       Access token giúp bạn truy cập các tài nguyên được bảo vệ, 
 *       còn refresh token sẽ giúp bạn lấy access token mới khi nó hết hạn mà không cần đăng nhập lại. 
 *       Giống như có một người bạn luôn đứng sẵn ở cổng để mở cửa cho bạn vậy!
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký của bạn
 *               phoneNumber:
 *                 type: string
 *                 description: Hoặc số điện thoại đã đăng ký nếu bạn thích
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu bí mật của bạn (đừng cho ai biết nhé!)
 *     responses:
 *       200:
 *         description: Đăng nhập thành công! Chào mừng trở lại!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token để truy cập hệ thống (có hiệu lực trong 1 giờ)
 *                 refreshToken:
 *                   type: string
 *                   description: Token để làm mới access token (có hiệu lực trong 1 ngày)
 *                 user:
 *                   type: object
 *                   description: Thông tin người dùng đã đăng nhập
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID người dùng
 *                     name:
 *                       type: string
 *                       description: Tên người dùng
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Email người dùng
 *                     phoneNumber:
 *                       type: string
 *                       description: Số điện thoại người dùng
 *                     address:
 *                       type: object
 *                       description: Địa chỉ người dùng 
 *                       properties:
 *                          
 *                     role:
 *                       type: string
 *                       enum: [customer, admin, anon]
 *                       description: Vai trò của người dùng
 *       401:
 *         description: Sai mật khẩu rồi! Hay là bạn đã quên mật khẩu?
 *       404:
 *         description: Không tìm thấy tài khoản này. Có lẽ bạn chưa đăng ký?
 *       500:
 *         description: Máy chủ đang gặp vấn đề. Xin lỗi vì sự bất tiện này!
 */
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
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     description: >
 *       Khi access token của bạn hết hạn, hãy dùng refresh token để lấy một access token mới mà không cần đăng nhập lại. 
 *       Giống như việc gia hạn vé xem phim mà không cần mua vé mới vậy! 
 *       Nhớ giữ refresh token an toàn nhé, nếu không người khác có thể mạo danh bạn đấy!
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token bạn đã nhận được khi đăng nhập
 *     responses:
 *       200:
 *         description: Đây là access token mới của bạn! Sử dụng vui vẻ nhé!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Access token mới để tiếp tục truy cập hệ thống
 *       401:
 *         description: Bạn chưa cung cấp refresh token. Làm sao chúng tôi giúp bạn được đây?
 *       403:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!
 */
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

/**
 * @swagger
 * /auth/sign-out:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     description: >
 *       Đăng xuất an toàn khỏi hệ thống bằng cách vô hiệu hóa refresh token của bạn. 
 *       Điều này giúp bảo vệ tài khoản của bạn khỏi những kẻ xấu. 
 *       Giống như việc khóa cửa nhà khi bạn ra ngoài vậy - an toàn là trên hết!
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID người dùng của bạn
 *     security:
 *        - bearerAuth: []
 *        - csrfToken: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công! Hẹn gặp lại bạn sớm nhé!
 *       500:
 *         description: Rất tiếc, có lỗi xảy ra khi đăng xuất. Hãy thử lại sau!
 */
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
    const refreshToken = req.cookies?.refreshToken;
    
    await AuthService.handleLogout(userId, accessToken, refreshToken);
    
    // Xóa cookie refreshToken
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
}

/**
 * @swagger
 * /auth/admin/sign-in:
 *   post:
 *     summary: Đăng nhập với quyền quản trị viên
 *     description: >
 *       Điểm truy cập an toàn dành riêng cho quản trị viên. 
 *       Yêu cầu xác thực đa lớp và chỉ cho phép từ địa chỉ IP được phê duyệt.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - adminKey
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               adminKey:
 *                 type: string
 *                 description: Khóa bí mật mà chỉ quản trị viên biết
 *     responses:
 *       200:
 *         description: Đăng nhập quản trị viên thành công
 *       401:
 *         description: Không được phép truy cập
 *       403:
 *         description: Bị cấm truy cập
 */
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
 * @swagger
 * /auth/send-password-reset-otp:
 *   post:
 *     summary: Gửi mã OTP để đặt lại mật khẩu
 *     description: >
 *       Quên mật khẩu? Đừng lo! Chúng tôi sẽ gửi mã OTP đến email của bạn để giúp đặt lại mật khẩu.
 *       Mã OTP chỉ có hiệu lực trong 10 phút và chỉ có thể sử dụng một lần cho mục đích bảo mật.
 *       Chúng tôi giới hạn số lần yêu cầu đặt lại mật khẩu để bảo vệ tài khoản của bạn.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký của bạn để nhận mã OTP
 *     responses:
 *       200:
 *         description: Mã OTP đã được gửi thành công hoặc thông báo nếu email tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Thông báo về trạng thái gửi OTP
 *                 expiresIn:
 *                   type: number
 *                   description: Thời gian hiệu lực của OTP tính bằng giây
 *       400:
 *         description: Yêu cầu không hợp lệ, thiếu email
 *       429:
 *         description: Quá nhiều yêu cầu trong một khoảng thời gian ngắn
 *       500:
 *         description: Lỗi máy chủ khi gửi OTP
 */
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
    
    console.error(`Lỗi khi gửi OTP đặt lại mật khẩu: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi gửi mã OTP" });
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     description: >
 *       Sử dụng mã OTP đã nhận được để đặt lại mật khẩu cho tài khoản của bạn.
 *       Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn cho tài khoản của bạn.
 *       Sau khi đặt lại thành công, bạn có thể sử dụng mật khẩu mới để đăng nhập ngay lập tức.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký của bạn
 *               otp:
 *                 type: string
 *                 description: Mã OTP đã nhận được qua email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới của bạn (ít nhất 6 ký tự)
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đặt lại mật khẩu thành công
 *       400:
 *         description: Yêu cầu không hợp lệ, thiếu thông tin hoặc mật khẩu không đạt yêu cầu
 *       401:
 *         description: Mã OTP không hợp lệ hoặc đã hết hạn
 *       500:
 *         description: Lỗi máy chủ khi đặt lại mật khẩu
 */
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
    console.error(`Lỗi đặt lại mật khẩu: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi đặt lại mật khẩu" });
  }
};

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Gửi mã OTP để đăng nhập
 *     description: >
 *       Gửi mã OTP đến email hoặc số điện thoại đã đăng ký của bạn để đăng nhập. 
 *       Đây là lựa chọn an toàn khi bạn không muốn sử dụng mật khẩu hoặc đang sử dụng thiết bị không đáng tin cậy.
 *       OTP có hiệu lực trong 10 phút và chỉ sử dụng được một lần.
 *     tags: [Auth]
 *     parameters:
 *        - in: header
 *          name: X-CSRF-Token
 *          required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký của bạn
 *               phoneNumber:
 *                 type: string
 *                 description: Hoặc số điện thoại đã đăng ký nếu bạn thích
 *     responses:
 *       200:
 *         description: Mã OTP đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Thông báo gửi OTP thành công
 *                 expiresIn:
 *                   type: number
 *                   description: Thời gian hiệu lực của OTP tính bằng giây
 *       400:
 *         description: Yêu cầu không hợp lệ, thiếu email hoặc số điện thoại
 *       404:
 *         description: Không tìm thấy tài khoản này
 *       429:
 *         description: Quá nhiều yêu cầu trong một khoảng thời gian ngắn
 *       500:
 *         description: Máy chủ đang gặp vấn đề khi gửi OTP
 */
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
    
    console.error(`Lỗi khi gửi OTP: ${error.message}`);
    res.status(500).json({ message: "Có lỗi xảy ra khi gửi mã OTP" });
  }
};

/**
 * @swagger
 * /auth/sign-in-otp:
 *   post:
 *     summary: Đăng nhập bằng OTP
 *     description: >
 *       Đăng nhập vào hệ thống bằng mã OTP đã được gửi đến email hoặc số điện thoại của bạn. 
 *       Phương thức này giúp bạn đăng nhập mà không cần nhớ mật khẩu và tăng cường bảo mật.
 *       OTP chỉ có hiệu lực trong 10 phút và không thể sử dụng lại sau khi đăng nhập thành công.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký của bạn
 *               phoneNumber:
 *                 type: string
 *                 description: Hoặc số điện thoại đã đăng ký nếu bạn thích
 *               otp:
 *                 type: string
 *                 description: Mã OTP được gửi đến bạn
 *     responses:
 *       200:
 *         description: Đăng nhập thành công! Chào mừng trở lại!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Token để truy cập hệ thống (có hiệu lực trong 1 giờ)
 *                 user:
 *                   type: object
 *                   description: Thông tin người dùng đã đăng nhập
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID người dùng
 *                     name:
 *                       type: string
 *                       description: Tên người dùng
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Email người dùng
 *                     phoneNumber:
 *                       type: string
 *                       description: Số điện thoại người dùng
 *                     role:
 *                       type: string
 *                       enum: [customer, admin]
 *                       description: Vai trò của người dùng
 *       400:
 *         description: Thiếu thông tin cần thiết
 *       401:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy tài khoản này
 *       500:
 *         description: Máy chủ đang gặp vấn đề. Xin lỗi vì sự bất tiện này!
 */
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
    console.error(`Lỗi đăng nhập với OTP: ${error.message}`);
    res.status(error.status || 500).json({ message: error.message });
  }
};

const AuthControllers = {
  registerUser,
  signIn,
  sendLoginOTP,
  signInWithOTP,
  handleRefreshToken,
  handleLogout,
  adminSignIn,
  sendPasswordResetOTP,
  resetPassword
};

export default AuthControllers;

