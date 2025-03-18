import mongoose, { mongo } from "mongoose";
import { User } from "../schemas/user.schema";
import bcrypt from "bcrypt";
import { config } from "dotenv";

config()

/**
 * @name getAllUsers
 * @author hungtran3011
 * @description Lấy danh sách tất cả người dùng trong hệ thống, chỉ dành cho Admin
 * Nếu muốn sử dụng, bắt buộc phải check người dùng đã đăng nhập hay chưa
 * sử dụng middleware @see {module:user.middleware.js}
 * 
 * @return {Array} Danh sách tất cả người dùng trong hệ thống
 * 
 */
const getAllUsers = async (req, res) => {
  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const userList = await User.find({}).skip(start).limit(limit);
  if (userList.length > 0) {
    return res.status(200).json(userList);
  }
  if (!userList) {
    return res.status(404).json({ message: "No users found" });
  }
}

const getUserById = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
}

/**
 * @name createNonRegisteredUser
 * @author hungtran3011
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
      isRegistered: false,
      role: "anon"
    });
    const existedUser = await User.findOne([
      "$or", [
        { email },
        { phoneNumber }
      ]
    ])
    if (existedUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    else await newUser.save();
    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const updateUser = async (req, res) => {
  try{
    const {id} = req.params;
    const {name, email, phoneNumber, address} = req.body;
    const updateUser = await User.findOneAndUpdate({_id: id}, {
      name,
      email,
      phoneNumber,
      address
    }, {new: true});
    return res.status(200).json(updateUser);
  }
  catch(e){
    res.status(500).json({message: e.message});
  }
}

const deleteUser = async (req, res) => { 
  try{
    const {id} = req.params;
    const deletedUser = await User.findOneAndDelete({_id: id});
    if (!deletedUser) {
      return res.status(404).json({message: "User not found"});
    }
    return res.status(204).send();
  }
  catch (e) {
    res.status(500).json({message: e.message});
  }
}

const UserControllers = {
  getAllUsers,
  getUserById,
  createNonRegisteredUser,
  registerUser,
  updateUser,
  deleteUser,
};

export default UserControllers;