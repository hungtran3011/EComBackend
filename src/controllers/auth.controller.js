import { User } from "../schemas/user.schema.js";

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
 *                 hashedPassword:
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
    const { name, email, phoneNumber, password, address } = req.body;
    const existedUser = await User.findOne({
      $or: [
        { email },
        { phoneNumber }
      ],
      isRegistered: false
    });
    if (existedUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phoneNumber,
      hashedPassword,
      address,
      isRegistered: true,
      role: "user" // Set appropriate role for registered users
    });
    await newUser.save();
    // Convert to plain object and remove hashedPassword
    const userResponse = newUser.toObject();
    delete userResponse.hashedPassword;
    res.status(201).json(userResponse);
  }
  catch (e) {
    res.status(500).json({ message: e.message });
  }
}


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
 *       401:
 *         description: Sai mật khẩu rồi! Hay là bạn đã quên mật khẩu?
 *       404:
 *         description: Không tìm thấy tài khoản này. Có lẽ bạn chưa đăng ký?
 *       500:
 *         description: Máy chủ đang gặp vấn đề. Xin lỗi vì sự bất tiện này!
 */
const signIn = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const user = await User.findOne({
      $or: [
        { email },
        { phoneNumber }
      ]
    })
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (isValidPassword) {
      const accessToken = jwt.sign(
        {
          "id": user._id,
          "role": user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h"
        }
      );
      const refreshToken = jwt.sign(
        {
          "username": user.email || user.phoneNumber,
          "role": user.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "1d"
        }
      );
      res.status(200).json({ accessToken, refreshToken });
    }
  }
  catch (e) {
    res.status(500).json({ message: e.message });
  }
}

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
const handleRefreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.sendStatus(401);
  }
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.sendStatus(403);
    }
    const accessToken = jwt.sign(
      {
        "id": user.id,
        "role": user.role
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h"
      }
    );
    res.status(200).json({ accessToken });
  })
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
 *     responses:
 *       200:
 *         description: Đăng xuất thành công! Hẹn gặp lại bạn sớm nhé!
 *       500:
 *         description: Rất tiếc, có lỗi xảy ra khi đăng xuất. Hãy thử lại sau!
 */
const handleLogout = (req, res) => {
  const { id } = req.params;
  User.findByIdAndUpdate(id, { refreshToken: null }, { new: true })
    .then(() => {
      res.status(200).json({ message: "Logout successfully" });
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    })
}

const AuthControllers = {
  registerUser,
  signIn,
  handleRefreshToken,
  handleLogout
}

export default AuthControllers

