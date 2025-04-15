/**
 * @swagger
 * components:
 *   parameters:
 *     CSRFToken:
 *       in: header
 *       name: X-CSRF-Token
 *       required: true
 *       description: CSRF token for preventing cross-site request forgery
 *       schema:
 *         type: string
 */

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
 * 
 *     parameters:
 *      - $ref: '#/components/parameters/CSRFToken'
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
 *     parameters:
 *      - $ref: '#/components/parameters/CSRFToken'
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
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     description: >
 *       Khi access token của bạn hết hạn, hãy dùng refresh token để lấy một access token mới mà không cần đăng nhập lại. 
 *       Giống như việc gia hạn vé xem phim mà không cần mua vé mới vậy! 
 *       Nhớ giữ refresh token an toàn nhé, nếu không người khác có thể mạo danh bạn đấy!
 *     tags: [Auth]
 *     parameters:
 *       - $ref: '#/components/parameters/CSRFToken'
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
 *       429:
 *         description: Quá nhiều yêu cầu. Vui lòng thử lại sau!
 */

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
 *       500:
 *         description: Lỗi máy chủ, vui lòng thử lại sau
 */

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
 *        - $ref: '#/components/parameters/CSRFToken'
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
 *       parameters:
 *        - $ref: '#/components/parameters/CSRFToken'
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