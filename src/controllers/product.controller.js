import mongoose from "mongoose";
import {ProductModel} from "../schemas/product.schema.js";

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm
 *     description: >
 *       Trả về danh sách tất cả các sản phẩm có trong cửa hàng. 
 *       Giống như khi bạn bước vào siêu thị và nhìn thấy tất cả các kệ hàng vậy! 
 *       Còn gì tuyệt vời hơn khi có thể xem tất cả sản phẩm chỉ với một cú nhấp chuột, 
 *       thay vì phải đi bộ hàng giờ trong siêu thị khổng lồ?
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Đây là danh sách tất cả sản phẩm của chúng tôi! Mua sắm vui vẻ nhé!
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Rất tiếc, cửa hàng của chúng tôi đang gặp trục trặc kỹ thuật. Quay lại sau nhé!
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await ProductModel.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết sản phẩm theo ID
 *     description: >
 *       Cung cấp thông tin chi tiết về một sản phẩm cụ thể dựa trên ID. 
 *       Giống như khi bạn cầm một món đồ trong cửa hàng và xem xét kỹ lưỡng nó vậy. 
 *       Bạn sẽ biết mọi thứ về sản phẩm - từ mô tả, giá cả, đến những đặc tính độc đáo của nó. 
 *       Nhưng nhớ là không được "sờ màn hình" để cảm nhận chất liệu nhé!
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID duy nhất của sản phẩm (như mã vạch vậy!)
 *     responses:
 *       200:
 *         description: Đây là thông tin chi tiết về sản phẩm bạn yêu cầu!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm này. Có thể nó đã bị người khác mua hết hoặc chưa bao giờ tồn tại!
 *       500:
 *         description: Máy chủ đang gặp khó khăn khi tìm kiếm sản phẩm này. Có lẽ nó đang trốn đâu đó trong kho dữ liệu!
 */
const getProductById = async (req, res) => {}

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     description: >
 *       Thêm một sản phẩm mới vào cửa hàng của chúng tôi. 
 *       Giống như khi bạn trình làng một tác phẩm nghệ thuật mới vậy! 
 *       Hãy cung cấp đầy đủ thông tin để khách hàng có thể hiểu rõ về sản phẩm tuyệt vời của bạn. 
 *       Nhưng nhớ là, chỉ quản trị viên mới có quyền thêm sản phẩm mới - 
 *       chúng tôi không muốn ai đó thêm "khủng long bông biết hát" vào danh mục điện thoại di động đâu!
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm (hãy đặt tên thật hấp dẫn!)
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết về sản phẩm (càng chi tiết càng tốt!)
 *               price:
 *                 type: number
 *                 description: Giá sản phẩm (đừng đặt giá cao quá kẻo khách trốn hết!)
 *               category:
 *                 type: string
 *                 description: Danh mục sản phẩm (để khách hàng dễ tìm kiếm)
 *     responses:
 *       201:
 *         description: Sản phẩm mới đã được tạo thành công! Giờ thì ngồi chờ đơn đặt hàng đổ về thôi!
 *       400:
 *         description: Thông tin sản phẩm không hợp lệ. Bạn đã bỏ sót thông tin quan trọng nào đó!
 *       401:
 *         description: Bạn không có quyền thêm sản phẩm mới. Chỉ quản trị viên mới có đặc quyền này!
 *       500:
 *         description: Máy chủ gặp vấn đề khi thêm sản phẩm mới. Có lẽ kho dữ liệu đã hết chỗ?
 */
const createProduct = async (req, res) => {}

const updateProduct = async (req, res) => {}

const deleteProduct = async (req, res) => {}

const getAllCategories = async (req, res) => {}

const getCategoryById = async (req, res) => {}

const createCategory = async (req, res) => {}

const updateCategory = async (req, res) => {}

const deleteCategory = async (req, res) => {}

const ProductControllers = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default ProductControllers;