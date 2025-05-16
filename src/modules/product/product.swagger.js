/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID duy nhất của sản phẩm
 *         name: 
 *           type: string
 *           description: Tên sản phẩm
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về sản phẩm
 *         price:
 *           type: number
 *           description: Giá sản phẩm
 *         category:
 *           type: object
 *           description: Danh mục sản phẩm
 *         productImages:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách hình ảnh sản phẩm
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Các thẻ đặc điểm của sản phẩm
 *
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID duy nhất của danh mục
 *         name:
 *           type: string
 *           description: Tên danh mục
 *         description:
 *           type: string
 *           description: Mô tả chi tiết về danh mục
 *         fields:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               required:
 *                 type: boolean
 */

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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Các thẻ đặc điểm của sản phẩm (ví dụ "pin trâu", "màn hình lớn"...)
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Cập nhật thẻ đặc điểm của sản phẩm
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
 * @swagger
 * /product/categories:
 *   get:
 *     summary: Lấy danh sách tất cả các danh mục sản phẩm
 *     description: >
 *       Trả về danh sách tất cả các danh mục sản phẩm có trong cửa hàng.
 *       Giống như bảng chỉ dẫn các khu vực trong siêu thị vậy!
 *       Giúp khách hàng dễ dàng định hướng và tìm kiếm sản phẩm theo nhóm
 *       mà không cần phải lướt qua tất cả các sản phẩm.
 *     tags: [Categories]
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
 * @swagger
 * /product/category/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của danh mục theo ID
 *     description: >
 *       Cung cấp thông tin chi tiết về một danh mục cụ thể dựa trên ID.
 *       Giống như khi bạn đọc bảng chỉ dẫn chi tiết cho một khu vực trong siêu thị vậy!
 *       Bạn sẽ biết được mọi thông tin về danh mục - từ tên, mô tả, đến các trường dữ liệu đặc trưng.
 *     tags: [Categories]
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
 * @swagger
 * /product/category/name/{name}:
 *   get:
 *     summary: Lấy thông tin chi tiết của danh mục theo tên
 *     description: >
 *       Cung cấp thông tin chi tiết về một danh mục cụ thể dựa trên tên.
 *       Giống như khi bạn hỏi nhân viên siêu thị "Khu vực đồ điện tử ở đâu?" vậy!
 *       Dùng API này khi bạn chỉ biết tên danh mục mà không biết ID của nó.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Tên danh mục cần tìm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết về danh mục đã được trả về thành công!
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Không tìm thấy danh mục với tên này. Có lẽ bạn đã nhập sai tên?
 *       500:
 *         description: Máy chủ gặp vấn đề khi tìm kiếm danh mục. Hãy thử lại sau!
 */

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
 *     tags: [Categories]
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
 * @swagger
 * /product/category/{id}:
 *   put:
 *     summary: Cập nhật thông tin danh mục
 *     description: >
 *       Cập nhật thông tin cho danh mục đã có trong cửa hàng.
 *       Giống như khi bạn cải tạo lại một khu vực trong siêu thị vậy!
 *       Bạn có thể thay đổi tên, mô tả hoặc các trường dữ liệu đặc trưng của danh mục.
 *       Chỉ người dùng đã đăng nhập mới có thể thực hiện thao tác này.
 *     tags: [Categories]
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
 * @swagger
 * /product/category/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     description: >
 *       Xóa một danh mục khỏi cửa hàng.
 *       Giống như khi bạn loại bỏ hoàn toàn một khu vực trong siêu thị vậy!
 *       Lưu ý: Chức năng này có thể ảnh hưởng đến các sản phẩm thuộc danh mục bị xóa.
 *       Chỉ người dùng đã đăng nhập mới có thể thực hiện thao tác này.
 *     tags: [Categories]
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
 * @swagger
 * /product/{id}/images:
 *   post:
 *     summary: Tải lên hình ảnh cho sản phẩm
 *     description: >
 *       Cho phép tải lên nhiều hình ảnh cho một sản phẩm.
 *       Các hình ảnh sẽ được lưu trữ trên Cloudinary và URL sẽ được lưu trong cơ sở dữ liệu.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần thêm hình ảnh
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Các tệp hình ảnh cần tải lên
 *     responses:
 *       200:
 *         description: Hình ảnh đã được tải lên thành công!
 *       400:
 *         description: Không có hình ảnh nào được cung cấp.
 *       401:
 *         description: Bạn không có quyền tải lên hình ảnh. Chỉ quản trị viên mới có thể làm điều này!
 *       500:
 *         description: Máy chủ gặp vấn đề khi tải lên hình ảnh. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/{productId}/images/{imageId}:
 *   delete:
 *     summary: Xóa hình ảnh của sản phẩm
 *     description: >
 *       Xóa một hình ảnh cụ thể ra khỏi sản phẩm.
 *       Hình ảnh sẽ bị xóa khỏi Cloudinary và URL sẽ bị xóa khỏi cơ sở dữ liệu.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của hình ảnh cần xóa
 *     responses:
 *       200:
 *         description: Hình ảnh đã được xóa thành công!
 *       401:
 *         description: Bạn không có quyền xóa hình ảnh. Chỉ quản trị viên mới có thể làm điều này!
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc hình ảnh.
 *       500:
 *         description: Máy chủ gặp vấn đề khi xóa hình ảnh. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/{productId}/variations:
 *   post:
 *     summary: Tạo biến thể mới cho sản phẩm
 *     description: >
 *       Thêm một biến thể mới cho sản phẩm đã tồn tại.
 *       Biến thể cho phép bạn định nghĩa các phiên bản khác nhau của sản phẩm với các thuộc tính khác nhau.
 *     tags: [Variations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần thêm biến thể
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên biến thể
 *               price:
 *                 type: number
 *                 description: Giá của biến thể
 *               stock:
 *                 type: number
 *                 description: Số lượng tồn kho
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       201:
 *         description: Biến thể đã được tạo thành công!
 *       400:
 *         description: Dữ liệu không hợp lệ.
 *       401:
 *         description: Bạn không có quyền tạo biến thể. Chỉ quản trị viên mới có thể làm điều này!
 *       500:
 *         description: Máy chủ gặp vấn đề khi tạo biến thể. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/{productId}/variations:
 *   get:
 *     summary: Lấy tất cả biến thể của sản phẩm
 *     description: >
 *       Trả về danh sách tất cả các biến thể có sẵn cho một sản phẩm cụ thể.
 *       Giúp khách hàng xem tất cả các phiên bản có sẵn của sản phẩm.
 *     tags: [Variations]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Danh sách các biến thể đã được trả về thành công!
 *       404:
 *         description: Không tìm thấy sản phẩm với ID này.
 *       500:
 *         description: Máy chủ gặp vấn đề khi lấy biến thể. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/variation/{variationId}:
 *   put:
 *     summary: Cập nhật biến thể sản phẩm
 *     description: >
 *       Cập nhật thông tin cho biến thể sản phẩm đã tồn tại.
 *       Chỉ quản trị viên mới có thể thực hiện thao tác này.
 *     tags: [Variations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của biến thể cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới của biến thể
 *               price:
 *                 type: number
 *                 description: Giá mới của biến thể
 *               stock:
 *                 type: number
 *                 description: Số lượng tồn kho mới
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: Biến thể đã được cập nhật thành công!
 *       400:
 *         description: Dữ liệu cập nhật không hợp lệ.
 *       401:
 *         description: Bạn không có quyền cập nhật biến thể. Chỉ quản trị viên mới có thể làm điều này!
 *       404:
 *         description: Không tìm thấy biến thể với ID này.
 *       500:
 *         description: Máy chủ gặp vấn đề khi cập nhật biến thể. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/variation/{variationId}:
 *   delete:
 *     summary: Xóa biến thể sản phẩm
 *     description: >
 *       Xóa một biến thể cụ thể của sản phẩm.
 *       Chỉ quản trị viên mới có thể thực hiện thao tác này.
 *     tags: [Variations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của biến thể cần xóa
 *     responses:
 *       200:
 *         description: Biến thể đã được xóa thành công!
 *       401:
 *         description: Bạn không có quyền xóa biến thể. Chỉ quản trị viên mới có thể làm điều này!
 *       404:
 *         description: Không tìm thấy biến thể với ID này.
 *       500:
 *         description: Máy chủ gặp vấn đề khi xóa biến thể. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/{id}/tags:
 *   post:
 *     summary: Thêm các thẻ cho sản phẩm
 *     description: >
 *       Thêm các thẻ đặc điểm cho sản phẩm như "pin trâu", "màn hình lớn", v.v.
 *       Giúp khách hàng dễ dàng tìm kiếm sản phẩm theo các đặc điểm cụ thể.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần thêm thẻ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách các thẻ cần thêm
 *     responses:
 *       200:
 *         description: Thẻ đã được thêm thành công!
 *       400:
 *         description: Dữ liệu không hợp lệ.
 *       401:
 *         description: Bạn không có quyền thêm thẻ. Chỉ quản trị viên mới có thể làm điều này!
 *       500:
 *         description: Máy chủ gặp vấn đề khi thêm thẻ. Hãy thử lại sau!
 */

/**
 * @swagger
 * /product/{id}/tags:
 *   delete:
 *     summary: Xóa thẻ khỏi sản phẩm
 *     description: >
 *       Xóa một hoặc nhiều thẻ đặc điểm khỏi sản phẩm.
 *       Chỉ quản trị viên mới có thể thực hiện thao tác này.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần xóa thẻ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách các thẻ cần xóa
 *     responses:
 *       200:
 *         description: Thẻ đã được xóa thành công!
 *       400:
 *         description: Dữ liệu không hợp lệ.
 *       401:
 *         description: Bạn không có quyền xóa thẻ. Chỉ quản trị viên mới có thể làm điều này!
 *       500:
 *         description: Máy chủ gặp vấn đề khi xóa thẻ. Hãy thử lại sau!
 */