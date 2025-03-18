import { User } from "../schemas/user.schema";

/**
 * @name signIn
 * @author hungtran3011
 * @description Đăng nhập người dùng đã đăng ký tài khoản, trả về access token và refresh token
 * Refresh token sẽ được cập nhật trên database, cũng như trả về cho client
 * Nếu phía front end có sử dụng dạng server dạng Backend For Frontend (BFF) thì có thể gửi token dưới dạng json cho phía Backend đó (hiện tại đang tính như vậy), nếu không thì gửi refresh_token dưới dạng một HttpOnly cookie 
 * @see https://owasp.org/www-community/HttpOnly
 * @see https://stackoverflow.com/questions/57650692/where-to-store-the-refresh-token-on-the-client
 */
const signIn = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const user = await User.findOne([
      "$or", [
        { email },
        { phoneNumber }
      ]
    ])
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

const handleLogout = (req, res) => {
  const {id} = req.params;
  User.findByIdAndUpdate(id, {refreshToken: null}, {new: true})
    .then(() => {
      res.status(200).json({message: "Logout successfully"});
    })
    .catch((err) => {
      res.status(500).json({message: err.message});
    })
}

export default AuthControllers = {
  signIn,
  handleRefreshToken,
}

