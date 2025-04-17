/**
 * @swagger
 * /search:
 *   get:
 *     summary: Tìm kiếm sản phẩm với các tùy chọn lọc
 *     description: >
 *       Tìm kiếm sản phẩm theo từ khóa, phạm vi giá, danh mục và các trường tùy chỉnh.
 *       Hỗ trợ sắp xếp và phân trang kết quả để tìm kiếm hiệu quả hơn.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm trong tên và mô tả sản phẩm
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá tối thiểu
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá tối đa
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID danh mục để lọc
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Trường để sắp xếp (price, name, createdAt, ...)
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Hướng sắp xếp (asc hoặc desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số kết quả trên mỗi trang
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm phù hợp với các điều kiện tìm kiếm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Tổng số sản phẩm phù hợp
 *                     page:
 *                       type: integer
 *                       description: Trang hiện tại
 *                     limit:
 *                       type: integer
 *                       description: Số kết quả trên mỗi trang
 *                     pages:
 *                       type: integer
 *                       description: Tổng số trang
 *       400:
 *         description: Tham số tìm kiếm không hợp lệ
 *       500:
 *         description: Lỗi máy chủ khi thực hiện tìm kiếm
 */

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Lấy gợi ý tên sản phẩm dựa trên văn bản đã nhập
 *     description: >
 *       Trả về danh sách các tên sản phẩm bắt đầu bằng văn bản được cung cấp.
 *       Hữu ích cho chức năng gợi ý tự động khi người dùng đang nhập từ khóa tìm kiếm.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         required: true
 *         description: Văn bản một phần để lấy gợi ý
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Số lượng gợi ý tối đa cần trả về
 *     responses:
 *       200:
 *         description: Danh sách các gợi ý tên sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: Thiếu tham số văn bản
 *       500:
 *         description: Lỗi máy chủ khi lấy gợi ý
 */