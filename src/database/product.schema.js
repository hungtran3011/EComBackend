import mongoose from "mongoose";
import * as types from "./types.schema.js"

/**
 * @name User
 * @description Người dùng đăng nhập, có thể là khách hàng hoặc Admin. Nếu là Admin, có thển CRUD hệ thống, còn nếu là khách hàng, có thể sẽ được tối ưu hoá và cá nhân hoá trải nghiệm (nếu điều kiện cho phép) như mã giảm giá hoặc sự kiện riêng.
 * @typedef {Object} User
 * @property {String} name
 * @property {String} email
 * @property {String} phoneNumber
 * @property {String} password
 * @property {String} role
 * @property {Boolean} isVerified
 */
const User = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
})

/**
 * @name AnonymousUser
 * @description Đa phần người dùng sẽ là như thế này, với số điện thoại và email có thể dùng để liên lạc khi đặt hàng online. Hệ thống sẽ cần phải chuyển đổi thông tin của AnonymousUser sang User nếu người dùng này đăng ký tài khoản (theo số điện thoại hoặc email, hoặc cả hai).
 * @typedef {Object} AnonymousUser
 * @property {String} email 
 * @property {String} phoneNumber
 * @property {String} name
 */
const AnonymousUser = mongoose.Schema({
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  name: { type: String, required: true },
})

/**
 * @name Product
 * @description Sản phẩm bán trên hệ thống, có thể là điện thoại, laptop, phụ kiện hoặc linh kiện máy tính. Mỗi sản phẩm sẽ có một ID duy nhất, giá, mô tả và tên sản phẩm. Lưu ý: như cái tên đã chỉ ra, các sản phẩm cụ thể với các trường dữ liệu riêng biệt sẽ được định nghĩa ở các Schema khác như {@link Laptop} {@link ProductProcessor}.
 * @typedef {Object} Product
 * @property {String} id
 * @property {String} type
 * @property {String} name
 * @property {Number} price
 * @property {String} description
 */
const AbstractProduct = mongoose.Schema({
  id: {type: String, required: true},
  type: {type: String, required: true},
  name: {type: String, required: true},
  price: {type: Number, required: true},
  description: {type: String, required: true},
})

/**
 * @name NonProductProcessor
 * @description Thông tin cơ bản về một CPU, chưa chắc đã bán rời (kiểu như CPU laptop). Schema về CPU bán riêng sẽ ở {@link ProductProcessor}.
 */
const NonProductProcessor = mongoose.Schema({
  name: {type: String, required: true},
  cores: {type: Number, required: true},
  threads: {type: Number, required: true},
  baseClock: {type: Number, required: false},
  boostClock: {type: Number, required: false},
  cache: {type: String, required: true},
  brand: {type: String, required: true},
  series: {type: String, required: true},
  lithography: {type: Number, required: true},
  tdp: {type: Number, required: true},
})

/**
 * @name ProductProcessor
 * @description CPU bán rời, có thể là Intel, AMD hoặc các hãng khác. Mỗi CPU sẽ có giá, các biến thể (nếu có), bảo hành và thông số kỹ thuật cơ bản như số nhân, số luồng, xung nhịp cơ bản và xung nhịp tối đa.
 * @typedef {Object} ProductProcessor
 * @property {String} name
 * @property {Number} price
 * @property {Array} variants
 * @property {String} warranty
 */
const ProductProcessor = mongoose.Schema(NonProductProcessor, {
  price: {type: Number, required: true},
  variants: {type: Array, required: true},
  warranty: {type: String, required: true},
})

const Laptop = mongoose.Schema(AbstractProduct, {
  processor: {type: String, required: true},
  ram: {type: String, required: true},
  storage: {type: String, required: true},
  display: {type: String, required: true},
  graphics: {type: String, required: true},
  brand: {type: String, required: true},
  variants: {type: Array, required: true},
  warranty: {type: String, required: true},
})

const Phone = mongoose.Schema(AbstractProduct, {
  processor: {type: String, required: true},
  ram: {type: String, required: true},
  storage: {type: String, required: true},
  display: {type: String, required: true},
  camera: {type: types.Camera, required: true},
  brand: {type: String, required: true},
  variants: {type: types.Variants, required: true},
  warranty: {type: String, required: true},
})