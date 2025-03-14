import mongoose from "mongoose";
import * as types from "./types.schema.js"

/**
 * @name User
 * @author @hungtran3011
 * @description Người dùng đăng nhập, có thể là khách hàng hoặc Admin. Nếu là Admin, có thển CRUD hệ thống, còn nếu là khách hàng, có thể sẽ được tối ưu hoá và cá nhân hoá trải nghiệm (nếu điều kiện cho phép) như mã giảm giá hoặc sự kiện riêng. Với 
 * @typedef {Object} User
 * @property {String} name Tên người dùng
 * @property {String} email Email người dùng
 * @property {String} phoneNumber Số điện thoại
 * @property {String} password Mật khẩu, nếu có phải được mã hoá cẩn thận
 * @property {String} role Vai trò của người dùng, có thể là 
 * - `customer`: Khách hàng
 * - `admin`: Quản trị viên
 * - `anon`: Người dùng ẩn danh
 * @property {Boolean} isRegistered
 * @property {Date} createdAt
 */
const User = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: false },
  role: { type: String, required: true, enum: ['customer', 'admin', 'anon'], default: 'anon' },
  isRegistered: { type: Boolean, default: false },
}, {timestamps: true})

// /**
//  * @name AnonymousUser
//  * @description Đa phần người dùng sẽ là như thế này, với số điện thoại và email có thể dùng để liên lạc khi đặt hàng online. Hệ thống sẽ cần phải chuyển đổi thông tin của AnonymousUser sang User nếu người dùng này đăng ký tài khoản (theo số điện thoại hoặc email, hoặc cả hai).
//  * @typedef {Object} AnonymousUser
//  * @property {String} email 
//  * @property {String} phoneNumber
//  * @property {String} name
//  */
// const AnonymousUser = mongoose.Schema({
//   email: { type: String, required: true },
//   phoneNumber: { type: String, required: true },
//   name: { type: String, required: true },
// })