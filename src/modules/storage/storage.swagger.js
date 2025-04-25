/**
 * @swagger
 * components:
 *   schemas:
 *     StorageItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: Tham chiếu đến ID sản phẩm
 *         quantity:
 *           type: number
 *           description: Số lượng sản phẩm trong kho
 *     Storage:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StorageItem'
 *   responses:
 *     NotFound:
 *       description: Không tìm thấy tài nguyên
 *     ServerError:
 *       description: Lỗi máy chủ
 *
 * /storage:
 *   get:
 *     summary: Lấy thông tin kho hàng
 *     tags: [Storage]
 *     responses:
 *       200:
 *         description: Thông tin kho hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Storage'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /storage/{productId}:
 *   get:
 *     summary: Lấy số lượng sản phẩm trong kho
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Số lượng sản phẩm trong kho
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: string
 *                 quantity:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong kho
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Số lượng mới của sản phẩm
 *     responses:
 *       200:
 *         description: Số lượng sản phẩm đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: string
 *                 quantity:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */