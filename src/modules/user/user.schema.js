import mongoose, { model } from "mongoose";

/**
 * @name User
 * @author hungtran3011
 * @description Định nghĩa 1 user, có thể không hoặc có đăng ký tài khoản. 
 * Việc cho phép lưu trữ người dùng (người mua) không đăng ký tài khoản
 * sẽ giúp ích cho cửa hàng khi cần track khách nào mua hàng gì cũng như
 * các chính sách bảo hành và khuyến mãi. Các khách hàng được đăng ký có thể
 * sẽ được cá nhân hoá tốt hơn (nếu hệ thống cho phép)
 * @typedef {Object} User
 * @property {String} name Tên người dùng
 * @property {String} email Email người dùng (bắt buộc đối với người dùng đã đăng ký)
 * @property {String} phoneNumber Số điện thoại (bắt buộc đối với tất cả người dùng)
 * @property {String} password Mật khẩu (chỉ cho người dùng đã đăng ký). Mã hoá mật khẩu trước khi lưu
 * @property {Object} address Địa chỉ giao hàng của người dùng, bao gồm
 * - `homeNumber`: Số nhà
 * - `street`: tên đường
 * - `city`: Thành phố
 * - `district`: quận
 * - `state`: Bang
 * - `province`: tỉnh 
 * @property {String} role Vai trò người dùng: 'customer', 'admin', hoặc 'anon'
 * @property {Boolean} isRegistered Cho biết người dùng đã đăng ký hay chưa
 * @property {String} avatarUrl Đường dẫn đến ảnh đại diện của người dùng
 * @property {Date} createdAt Thời gian tạo
 */
const User = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: function() {return this.isRegistered} },
  address: {
    homeNumber: {type: String, required: false},
    street: { type: String, required: false },
    district: {type: String, required: false},
    city: { type: String, required: false },
    state: { type: String, required: false },
    province: { type: String, required: false }
  },
  role: { type: String, required: true, enum: ['customer', 'admin', 'anon'], default: 'anon' },
  avatarUrl: { type: String, required: false },
  isRegistered: { type: Boolean, default: false },
}, {timestamps: true}) 

const UserModel = mongoose.model("User", User);

const UserImageSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  imageUrl: { type: String, required: true },
}, { timestamps: true });

const UserImageModel = mongoose.model("UserImage", UserImageSchema);

export {UserModel as User, UserImageModel as UserImage};

