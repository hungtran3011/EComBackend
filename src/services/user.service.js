import { User } from "../schemas/user.schema.js";
import { UserValidationSchema } from "../validators/user.validator.js";
import mongoose from "mongoose";

/**
 * @name findUserByEmailOrPhone
 * @description Tìm người dùng dựa trên email hoặc số điện thoại
 * @param {string} email - Email của người dùng (tùy chọn)
 * @param {string} phoneNumber - Số điện thoại của người dùng (tùy chọn)
 * @returns {Promise<Object|null>} Thông tin người dùng hoặc null nếu không tìm thấy
 * @throws {Error} Nếu không cung cấp email hoặc số điện thoại
 */
const findUserByEmailOrPhone = async (email, phoneNumber) => {
  if (!email && !phoneNumber) {
    throw new Error("Email hoặc số điện thoại là bắt buộc");
  }

  const query = { isRegistered: true };

  const { validEmail, validPhone } = UserValidationSchema.parse({ 
    email: email, 
    phoneNumber: phoneNumber
  });
  
  if (email) {
    query.email = validEmail;
  } else if (phoneNumber) {
    query.phoneNumber = validPhone;
  }
  
  return await User.findOne(query);
};

/**
 * @name getAllUsers
 * @description Lấy danh sách tất cả người dùng với phân trang
 * @param {number} start - Vị trí bắt đầu
 * @param {number} limit - Số lượng người dùng trên mỗi trang
 * @returns {Promise<Object>} Danh sách người dùng và thông tin phân trang
 */
const getAllUsers = async (start = 0, limit = 10) => {
  // Convert parameters to integers
  const startIndex = parseInt(start);
  const limitCount = parseInt(limit);
  
  // Get total count first for pagination info
  const total = await User.countDocuments();
  const pages = Math.ceil(total / limitCount);
  
  // Always return pagination info, even with empty results
  if (total === 0) {
    return {
      pages: 0,
      limit: limitCount,
      total: 0,
      users: []
    };
  }
  
  // Fetch users with pagination
  const userList = await User.find({})
    .skip(startIndex)
    .limit(limitCount)
    .select('-password -refreshToken -__v');

  // Transform users through validation schema
  const returnUserList = userList.map(user => {
    return UserValidationSchema.parse({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
    });
  });

  // Return consistent response format
  return {
    pages,
    limit: limitCount,
    total,
    users: returnUserList
  };
}

/**
 * @name getUserById
 * @description Lấy thông tin chi tiết của người dùng theo ID
 * @param {string} id - ID của người dùng
 * @param {Object} currentUser - Người dùng hiện tại
 * @returns {Promise<Object>} Thông tin chi tiết của người dùng
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy người dùng
 */
const getUserById = async (id, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID format");
  }

  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    throw new Error("Access denied. You can only view your own profile.");
  }

  const user = await User.findById(id).select('-password -refreshToken -__v');
  if (!user) {
    throw new Error("User not found");
  }

  return UserValidationSchema.parse({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    address: user.address,
  });
}

/**
 * @name createNonRegisteredUser
 * @description Tạo một người dùng chưa đăng ký
 * @param {Object} userData - Dữ liệu người dùng
 * @returns {Promise<Object>} Người dùng vừa được tạo
 */
const createNonRegisteredUser = async (userData) => {
  const { name, email, phoneNumber, address } = userData;

    let validatedData;
    try {
      validatedData = UserValidationSchema.parse({ name, email, phoneNumber, address });
    } catch (validationError) {
      throw new Error("Validation error");
    }

    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email },
        { phoneNumber: validatedData.phoneNumber }
      ]
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const newUser = new User({
      ...validatedData,
      isRegistered: false,
      role: "anon",
      password: "",
      refreshToken: ""
    });

    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return {
      message: "User created successfully",
      user: userResponse,
    };
}

/**
 * @name updateUser
 * @description Cập nhật thông tin người dùng
 * @param {string} id - ID của người dùng
 * @param {Object} currentUser - Người dùng hiện tại
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Người dùng sau khi được cập nhật
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy người dùng
 */
const updateUser = async (id, currentUser, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID format");
  }

  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    throw new Error("Access denied. You can only update your own profile.");
  }

  const updateFields = {};
  if (updateData.name !== undefined) updateFields.name = updateData.name.trim();
  if (updateData.email !== undefined) updateFields.email = updateData.email.trim().toLowerCase();
  if (updateData.phoneNumber !== undefined) updateFields.phoneNumber = updateData.phoneNumber.trim();
  if (updateData.address !== undefined) updateFields.address = updateData.address;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      UserValidationSchema.parse(updateFields),
      { new: true, runValidators: true }
    ).select('-password -refreshToken -__v');

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  } catch (validationError) {
    throw new Error("Validation error");
  }
}

/**
 * @name deleteUser
 * @description Xóa người dùng theo ID
 * @param {string} id - ID của người dùng
 * @param {Object} currentUser - Người dùng hiện tại
 * @returns {Promise<void>} Không trả về giá trị
 * @throws {Error} Nếu ID không hợp lệ hoặc không tìm thấy người dùng
 */
const deleteUser = async (id, currentUser) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid user ID format");
  }

  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    throw new Error("Access denied. You can only delete your own account.");
  }

  const deletedUser = await User.findOneAndDelete({ _id: id });
  if (!deletedUser) {
    throw new Error("User not found");
  }
}

export const UserService = {
  getAllUsers,
  getUserById,
  createNonRegisteredUser,
  updateUser,
  deleteUser,
  findUserByEmailOrPhone // Thêm hàm mới vào export
};
