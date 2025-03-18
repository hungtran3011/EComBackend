import mongoose from "mongoose";
import { User } from "../schemas/user.schema.js";
import { config } from "dotenv";

config()

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     description: >
 *       API này trả về danh sách tất cả người dùng trong hệ thống, có phân trang để tránh quá tải. 
 *       Bạn có thể tưởng tượng nó như một cuốn danh bạ khổng lồ, nhưng thay vì lật từng trang, 
 *       bạn chỉ cần nói với chúng tôi bạn muốn xem trang nào! 
 *       Lưu ý: API này chỉ dành cho quản trị viên, vì lý do riêng tư hiển nhiên rồi!
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Số lượng bản ghi cần bỏ qua (như kiểu bạn muốn bắt đầu từ trang nào đó)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi tối đa trả về (đừng tham lam quá nhé!)
 *     responses:
 *       200:
 *         description: Đây là danh sách người dùng bạn yêu cầu!
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy người dùng nào cả. Có lẽ chúng ta đang ở trong vũ trụ song song?
 *       401:
 *         description: Bạn không có quyền xem danh sách này. Nâng cấp tài khoản hoặc liên hệ quản trị viên nhé!
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

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     description: >
 *       Lấy thông tin chi tiết của một người dùng dựa trên ID. 
 *       Giống như tìm kiếm hồ sơ của một người cụ thể trong một tòa nhà đầy người vậy. 
 *       ID chính là số phòng của họ, và chúng tôi sẽ dẫn bạn đến đúng cánh cửa đó!
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng (như một địa chỉ nhà duy nhất vậy!)
 *     responses:
 *       200:
 *         description: Đã tìm thấy người dùng! Đây là thông tin chi tiết.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Không tìm thấy người dùng với ID này. Có thể họ đã chuyển nhà?
 *       401:
 *         description: Bạn không có quyền xem thông tin này. Đây là khu vực hạn chế!
 */
const getUserById = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
}

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Tạo người dùng mới không cần đăng ký
 *     description: >
 *       Tạo người dùng mới mà không yêu cầu đăng ký chính thức, thường dùng cho khách mua hàng nhanh. 
 *       Giống như việc cho phép ai đó ghé thăm nhà bạn mà không cần làm thẻ thành viên của khu dân cư. 
 *       Họ vẫn có thể mua sắm, nhưng sẽ không có tất cả các đặc quyền của thành viên chính thức!
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên của người dùng (chúng tôi nên gọi bạn là gì?)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email (không bắt buộc, nhưng hữu ích để liên hệ)
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (để chúng tôi có thể gọi cho bạn khi đơn hàng đến)
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *                 description: Địa chỉ giao hàng (để chúng tôi biết giao hàng đến đâu)
 *     responses:
 *       201:
 *         description: Đã tạo người dùng mới thành công! Chào mừng đến với cửa hàng của chúng tôi!
 *       400:
 *         description: Người dùng này đã tồn tại rồi! Có lẽ bạn đã từng ghé thăm chúng tôi trước đây?
 *       500:
 *         description: Ôi không! Máy chủ gặp sự cố khi tạo người dùng mới.
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
    const existedUser = await User.findOne({
      $or: [
        { email },
        { phoneNumber }
      ]
    });
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

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     description: >
 *       Cập nhật thông tin của người dùng hiện có, như tên, email, số điện thoại hoặc địa chỉ. 
 *       Giống như việc sơn lại nhà bạn vậy - cấu trúc vẫn giữ nguyên, nhưng ngoại hình có thể thay đổi hoàn toàn! 
 *       Đừng lo, chúng tôi sẽ không làm mất đồ của bạn trong quá trình này đâu!
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới (nếu bạn muốn đổi tên)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email mới (nếu bạn muốn đổi email)
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại mới (nếu bạn đổi số)
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *                 description: Địa chỉ mới (nếu bạn đã chuyển nhà)
 *     responses:
 *       200:
 *         description: Thông tin đã được cập nhật thành công! Trông bạn thật tuyệt với diện mạo mới này!
 *       404:
 *         description: Không tìm thấy người dùng này. Có thể họ đã biến mất khỏi hệ thống?
 *       401:
 *         description: Bạn không có quyền cập nhật thông tin này. Đây không phải hồ sơ của bạn!
 *       500:
 *         description: Có lỗi xảy ra khi cập nhật thông tin. Có vẻ như máy chủ hơi mệt mỏi!
 */
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

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     description: >
 *       Xóa hoàn toàn một người dùng khỏi hệ thống. Hành động này không thể hoàn tác! 
 *       Giống như khi bạn xóa số điện thoại của người yêu cũ vậy - một khi đã xóa, 
 *       bạn sẽ phải bắt đầu lại từ đầu nếu muốn kết nối lại. 
 *       Hãy cẩn thận với quyền lực này, nó rất mạnh mẽ!
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng sắp bị "thanh trừng" khỏi hệ thống
 *     responses:
 *       204:
 *         description: Người dùng đã được xóa thành công. Họ sẽ được nhớ mãi trong tim chúng tôi!
 *       404:
 *         description: Không tìm thấy người dùng này để xóa. Có lẽ họ đã tự biến mất trước đó?
 *       401:
 *         description: Bạn không có quyền xóa người này. Quyền lực lớn đi kèm trách nhiệm lớn!
 *       500:
 *         description: Máy chủ gặp sự cố khi thực hiện lệnh xóa. Có vẻ như nó đang cố bảo vệ người dùng này!
 */
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
  updateUser,
  deleteUser,
};

export default UserControllers;