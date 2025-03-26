import mongoose from "mongoose";
import { Product, Category } from "../schemas/product.schema.js";
import { 
  ProductSchema, 
  ProductListSchema, 
  CategorySchema, 
  isValidMongoId,
  PaginationValidation,
  CategoriesSchema,
} from "../validators/product.validator.js";

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
    const { page = 1, limit = 10 } = PaginationValidation.parse(req.query);
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments();
    const products = await Product.find().skip(startIndex).limit(limit);

    res.status(200).json(ProductListSchema.parse({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      products,
    }));
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
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Product ID cannot be empty" });
    }
    if (!isValidMongoId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(ProductSchema.parse(product))
  }
  catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     description: >
 *       Thêm một sản phẩm mới vào cửa hàng. 
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
/**
 * @name createProduct
 * @description Creates a new product
 */
const createProduct = async (req, res) => {
  try {
    // Xem lại phần user.middleware.js, thông tin user đã được thêm vào request
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Không có quyền truy cập, vui lòng đăng nhập" });
    }

    // Kiểm tra user có quyền admin hay không
    if (!user.isAdmin) {
      return res.status(401).json({ message: "Chỉ quản trị viên mới có quyền thêm sản phẩm" });
    }
    const { name, description, price, category } = req.body;
    const newProduct = ProductSchema.parse({
      name: name,
      description: description,
      price: price,
      category: category,
      createdBy: user._id,
    })
    const addedProduct = Product(newProduct);
    await addedProduct.save()
    res.status(201).json(ProductSchema.parse(addedProduct.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     description: >
 *       Cập nhật thông tin cho sản phẩm đã có trong cửa hàng.
 *       Giống như khi bạn đổi nhãn giá hoặc mô tả cho sản phẩm trên kệ vậy!
 *       Chỉ quản trị viên mới có thể thực hiện thao tác này - chúng tôi không muốn
 *       khách hàng tự ý giảm giá sản phẩm xuống 1 đồng đâu!
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới của sản phẩm
 *               description:
 *                 type: string
 *                 description: Mô tả mới về sản phẩm
 *               price:
 *                 type: number
 *                 description: Giá mới của sản phẩm
 *               category:
 *                 type: string
 *                 description: Danh mục mới của sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm đã được cập nhật thành công!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Dữ liệu cập nhật không hợp lệ hoặc ID sản phẩm không đúng định dạng.
 *       401:
 *         description: Bạn không có quyền cập nhật sản phẩm. Chỉ quản trị viên mới có thể làm điều này!
 *       404:
 *         description: Không tìm thấy sản phẩm với ID này. Có lẽ nó đã bị xóa hoặc chưa từng tồn tại?
 *       500:
 *         description: Máy chủ gặp vấn đề khi cập nhật sản phẩm. Hãy thử lại sau!
 */
/**
 * @name updateProduct
 * @author hungtran3011
 * @description Cập nhật thông tin sản phẩm. Chỉ quản trị viên mới có quyền này.
 * @param {string} id - ID sản phẩm cần cập nhật
 * @param {*} req 
 * @param {*} res 
 */
const updateProduct = async (req, res) => {
  const {id} = req.params;
  const {userId, role} = req.user;
  
  // Validation checks
  if (!id) 
    return res.status(400).json({ message: "ID sản phẩm không được để trống" });
  if (!userId)
    return res.status(401).json({ message: "No permission"})
  if (role !== 'admin')
    return res.status(401).json({message: "Admin only"})
  if (!isValidMongoId(id))
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    
  try {
    // Create an object with only the fields that are present in the request
    const updateData = {};
    const { name, description, price, category } = req.body;
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    
    // Validate the update data using partial schema validation
    const validatedData = ProductSchema.partial().parse(updateData);
    
    // Update only the provided fields and return the updated document
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      { $set: validatedData }, 
      { new: true }
    );
    
    if (!updatedProduct) 
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    
    // Parse the product through the schema to ensure consistent response format
    // and remove any unwanted MongoDB fields like __v
    return res.status(200).json(ProductSchema.parse(updatedProduct.toObject()));
  }
  catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     description: >
 *       Xóa một sản phẩm khỏi cửa hàng.
 *       Giống như khi bạn lấy một món hàng ra khỏi kệ vĩnh viễn vậy!
 *       Chỉ quản trị viên mới có thể thực hiện thao tác này - 
 *       chúng tôi không muốn ai đó tự ý xóa hết sản phẩm trong cửa hàng đâu!
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa thành công!
 *       400:
 *         description: ID sản phẩm không hợp lệ hoặc không được cung cấp.
 *       401:
 *         description: Bạn không có quyền xóa sản phẩm. Chỉ quản trị viên mới có thể làm điều này!
 *       404:
 *         description: Không tìm thấy sản phẩm với ID này. Có lẽ nó đã bị xóa trước đó hoặc chưa từng tồn tại?
 *       500:
 *         description: Máy chủ gặp vấn đề khi xóa sản phẩm. Hãy thử lại sau!
 */
/**
 * @name deleteProduct
 * @author hungtran3011
 * @description Xóa sản phẩm khỏi cửa hàng. Chỉ quản trị viên mới có quyền này.
 * @param {string} id - ID sản phẩm cần xóa
 * @param {*} req 
 * @param {*} res 
 */
const deleteProduct = async (req, res) => {
  const {id} = req.params
  const {userId, role} = req.user;
  if (!id) 
    return res.status(400).json({ message: "ID sản phẩm không được để trống" });
  if (!userId)
    return res.status(401).json({ message: "No permission"})
  if (role !== 'admin')
    return res.status(401).json({message: "Admin only"})
  if (!isValidMongoId(id))
    return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    return res.status(200).json({ message: "Sản phẩm đã được xóa thành công" });
  }
  catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/categories:
 *   get:
 *     summary: Lấy danh sách tất cả các danh mục sản phẩm
 *     description: >
 *       Trả về danh sách tất cả các danh mục sản phẩm có trong cửa hàng.
 *       Giống như bảng chỉ dẫn các khu vực trong siêu thị vậy!
 *       Giúp khách hàng dễ dàng định hướng và tìm kiếm sản phẩm theo nhóm
 *       mà không cần phải lướt qua tất cả các sản phẩm.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách các danh mục sản phẩm đã được trả về thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Máy chủ gặp vấn đề khi truy xuất danh mục. Vui lòng thử lại sau!
 */
/**
 * @name getAllCategories
 * @author hungtran3011
 * @description Lấy danh sách tất cả các danh mục sản phẩm hiện có trong cửa hàng.
 * @param {*} req 
 * @param {*} res 
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(CategoriesSchema.parse(categories));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/category/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của danh mục theo ID
 *     description: >
 *       Cung cấp thông tin chi tiết về một danh mục cụ thể dựa trên ID.
 *       Giống như khi bạn đọc bảng chỉ dẫn chi tiết cho một khu vực trong siêu thị vậy!
 *       Bạn sẽ biết được mọi thông tin về danh mục - từ tên, mô tả, đến các trường dữ liệu đặc trưng.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID duy nhất của danh mục
 *     responses:
 *       200:
 *         description: Thông tin chi tiết về danh mục đã được trả về thành công!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: ID danh mục không hợp lệ hoặc không được cung cấp.
 *       404:
 *         description: Không tìm thấy danh mục với ID này. Có lẽ nó đã bị xóa hoặc chưa từng tồn tại?
 *       500:
 *         description: Máy chủ gặp vấn đề khi tìm kiếm danh mục. Hãy thử lại sau!
 */
/**
 * @name getCategoryById
 * @author hungtran3011
 * @description Lấy thông tin chi tiết của một danh mục dựa trên ID
 * @param {string} id - ID danh mục cần truy vấn
 * @param {*} req 
 * @param {*} res 
 */
const getCategoryById = async (req, res) => {
  const {id} = req.params
  if (!id) 
    return res.status(400).json({ message: "ID danh mục không được để trống" });
  if (!isValidMongoId(id))
    return res.status(400).json({ message: "ID danh mục không hợp lệ" });
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.status(200).json(CategorySchema.parse(category));
  }
  catch (error) {
    return res.status(500).json({message: error.message})
  }
}

/**
 * @swagger
 * /product/category:
 *   post:
 *     summary: Tạo danh mục mới
 *     description: >
 *       Thêm một danh mục sản phẩm mới vào cửa hàng.
 *       Giống như khi bạn tạo ra một khu vực mới trong siêu thị vậy!
 *       Bạn có thể định nghĩa các trường thông tin đặc trưng cho danh mục,
 *       giúp việc quản lý và hiển thị sản phẩm trở nên linh hoạt hơn.
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục (đặt tên ngắn gọn, dễ nhớ!)
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết về danh mục
 *               fields:
 *                 type: array
 *                 description: Các trường dữ liệu đặc trưng của danh mục
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Tên trường dữ liệu
 *                     type:
 *                       type: string
 *                       enum: [String, Number, Date, Boolean, ObjectId, Array, Mixed]
 *                       description: Loại dữ liệu của trường
 *                     required:
 *                       type: boolean
 *                       description: Trường dữ liệu có bắt buộc hay không
 *     responses:
 *       201:
 *         description: Danh mục mới đã được tạo thành công!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Thông tin danh mục không hợp lệ. Tên danh mục không được để trống!
 *       401:
 *         description: Bạn không có quyền tạo danh mục mới. Vui lòng đăng nhập!
 *       500:
 *         description: Máy chủ gặp vấn đề khi tạo danh mục mới. Hãy thử lại sau!
 */
/**
 * @name createCategory
 * @author hungtran3011
 * @description Tạo một danh mục sản phẩm mới. Người dùng phải đăng nhập để thực hiện thao tác này.
 * @param {*} req 
 * @param {*} res 
 */
const createCategory = async (req, res) => {
  const {name, description, fields} = req.body
  const {userId} = req.user;
  if (!userId)
    return res.status(401).json({ message: "No permission"})
  if (!name) 
    return res.status(400).json({ message: "Tên danh mục không được để trống" });
  try {
    const newCategory = CategorySchema.parse({
      name: name,
      description: description,
      fields: fields,
      createdBy: userId,
    })
    const addedCategory = Category(newCategory);
    await addedCategory.save()
    res.status(201).json(CategorySchema.parse(addedCategory.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/category/{id}:
 *   put:
 *     summary: Cập nhật thông tin danh mục
 *     description: >
 *       Cập nhật thông tin cho danh mục đã có trong cửa hàng.
 *       Giống như khi bạn cải tạo lại một khu vực trong siêu thị vậy!
 *       Bạn có thể thay đổi tên, mô tả hoặc các trường dữ liệu đặc trưng của danh mục.
 *       Chỉ người dùng đã đăng nhập mới có thể thực hiện thao tác này.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của danh mục cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới của danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả mới về danh mục
 *               fields:
 *                 type: array
 *                 description: Các trường dữ liệu đặc trưng mới của danh mục
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Tên trường dữ liệu
 *                     type:
 *                       type: string
 *                       enum: [String, Number, Date, Boolean, ObjectId, Array, Mixed]
 *                       description: Loại dữ liệu của trường
 *                     required:
 *                       type: boolean
 *                       description: Trường dữ liệu có bắt buộc hay không
 *     responses:
 *       200:
 *         description: Thông tin danh mục đã được cập nhật thành công!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Dữ liệu cập nhật không hợp lệ hoặc ID danh mục không đúng định dạng.
 *       401:
 *         description: Bạn không có quyền cập nhật danh mục. Vui lòng đăng nhập!
 *       404:
 *         description: Không tìm thấy danh mục với ID này. Có lẽ nó đã bị xóa hoặc chưa từng tồn tại?
 *       500:
 *         description: Máy chủ gặp vấn đề khi cập nhật danh mục. Hãy thử lại sau!
 */
/**
 * @name updateCategory
 * @author hungtran3011
 * @description Cập nhật thông tin danh mục. Người dùng phải đăng nhập để thực hiện thao tác này.
 * @param {string} id - ID danh mục cần cập nhật
 * @param {*} req 
 * @param {*} res 
 */
const updateCategory = async (req, res) => { 
  const {id} = req.params
  const {userId} = req.user;
  
  if (!id) 
    return res.status(400).json({ message: "ID danh mục không được để trống" });
  if (!userId)
    return res.status(401).json({ message: "No permission"})
  if (!isValidMongoId(id))
    return res.status(400).json({ message: "ID danh mục không hợp lệ" });
    
  try {
    const {name, description, fields} = req.body;
    
    // Validate only the fields that are provided
    const validatedData = {};
    if (name !== undefined) validatedData.name = CategorySchema.shape.name.parse(name);
    if (description !== undefined) validatedData.description = CategorySchema.shape.description.parse(description);
    if (fields !== undefined) validatedData.fields = CategorySchema.shape.fields.parse(fields);
    
    // Use $set to only update the provided fields
    const result = await Category.findByIdAndUpdate(
      id, 
      { $set: validatedData }, 
      { new: true }
    );
    
    if (!result) return res.status(404).json({ message: "Không tìm thấy danh mục" });
    
    // Return the actual updated document from the database
    return res.status(200).json(CategoriesSchema.parse(result.toObject()));
  }
  catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /product/category/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     description: >
 *       Xóa một danh mục khỏi cửa hàng.
 *       Giống như khi bạn loại bỏ hoàn toàn một khu vực trong siêu thị vậy!
 *       Lưu ý: Chức năng này có thể ảnh hưởng đến các sản phẩm thuộc danh mục bị xóa.
 *       Chỉ người dùng đã đăng nhập mới có thể thực hiện thao tác này.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của danh mục cần xóa
 *     responses:
 *       200:
 *         description: Danh mục đã được xóa thành công!
 *       400:
 *         description: ID danh mục không hợp lệ hoặc không được cung cấp.
 *       401:
 *         description: Bạn không có quyền xóa danh mục. Vui lòng đăng nhập!
 *       404:
 *         description: Không tìm thấy danh mục với ID này. Có lẽ nó đã bị xóa trước đó hoặc chưa từng tồn tại?
 *       500:
 *         description: Máy chủ gặp vấn đề khi xóa danh mục. Hãy thử lại sau!
 */
/**
 * @name deleteCategory
 * @author hungtran3011
 * @description Xóa danh mục khỏi cửa hàng. Người dùng phải đăng nhập để thực hiện thao tác này.
 * @param {string} id - ID danh mục cần xóa
 * @param {*} req 
 * @param {*} res 
 */
const deleteCategory = async (req, res) => {
  const {id} = req.params
  const {userId} = req.user;
  if (!id) 
    return res.status(400).json({ message: "ID danh mục không được để trống" });
  if (!userId)
    return res.status(401).json({ message: "No permission"})
  if (!isValidMongoId(id))
    return res.status(400).json({ message: "ID danh mục không hợp lệ" });
  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    return res.status(200).json({ message: "Danh mục đã được xóa thành công" });
  }
  catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

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