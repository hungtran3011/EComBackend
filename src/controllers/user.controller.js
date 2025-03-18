import mongoose from "mongoose";
import { User, User } from "../schemas/user.schema";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

const getAllUsers = async (req, res) => { }

const getUserById = async (req, res) => {

}

/**
 * @name registerUser
 * @author @hungtran3011
 * @description Đăng ký người dùng mới, cho phép sử dụng số điện thoại hoặc email để đăng nhập
 * Xác thực bằng mật khẩu, sau này có thể thêm xác thực 2 yếu tố như mail hay authenticate app
 * Có thể thêm các thông tin khác như địa chỉ
 * @summary Đăng ký người dùng mới
 * @param {*} req 
 * @param {*} res 
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, address } = req.body;
    const existedUser = await User.findOne([
      "$or", [
        { email },
        { phoneNumber }
      ]
    ])
    if (existedUser) {
      res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phoneNumber,
      hashedPassword,
      address
    })
    await newUser.save();
    delete newUser.hashedPassword;
    res.status(201).json(newUser);
  }
  catch (e) {
    res.status(500).json({ message: e.message });
 }
}

/**
 * @name createNonRegisteredUser
 * @author @hungtran3011
 * @description Tạo một người dùng mới trong hệ thống bán hàng mà không cần đăng ký tài khoản
 * Thường thì việc tạo người dùng mới mà không đăng ký sẽ hỗ trợ việc lưu trữ thông tin khách mua hàng
 * cũng như hỗ trợ bảo hành hay khuyến mãi.
 * Công việc
 * @summary Tạo một người dùng mới mà không cần đăng ký tài khoản
 */
const createNonRegisteredUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, address } = req.body;
    const newUser = new User({
      name,
      email,
      phoneNumber,
      address,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const signIn = async (req, res) => {
  try{
    const {email, phoneNumber, password} = req.body;
    const user = await User.findOne([
      "$or", [
        {email},
        {phoneNumber}
      ]
    ])
    if (!user) {
      res.status(404).json({message: "User not found"});
    }
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
    if (isValidPassword){
      const accessToken = jwt.sign({
        "username": user.email || user.phoneNumber,
        "role": user.role
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h"
      });
    }
  }
  catch (e) {
    res.status(500).json({message: e.message});
  }
}

const updateUser = async (req, res) => { }

const deleteUser = async (req, res) => { }

const UserControllers = {
  getAllUsers,
  getUserById,
  createNonRegisteredUser,
  registerUser,
  updateUser,
  signIn,
  deleteUser,
};

export default UserControllers;