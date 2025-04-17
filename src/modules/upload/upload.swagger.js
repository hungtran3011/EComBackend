/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       in: header
 *       name: Authorization
 *       bearerFormat: JWT
 *       description: JWT bearer token for API authentication
 *     csrfToken:
 *       type: apiKey
 *       in: header
 *       name: X-CSRF-Token
 *       description: CSRF token for cross-site request forgery protection
 */

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload an image to Cloudinary
 *     description: Uploads an image file to Cloudinary and categorizes it by type (product, user, etc.)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Bearer token for authentication
 *       - in: header
 *         name: X-CSRF-Token
 *         type: string
 *         required: true
 *         description: CSRF token for protection against cross-site request forgery
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Image file to upload (JPG, PNG, GIF, etc.)
 *       - in: formData
 *         name: type
 *         type: string
 *         required: true
 *         description: Category type (product, user, category)
 *         enum: [product, user, category]
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                       example: "ecommapp/products/abc123"
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/your-cloud/image/upload/v1234/ecommapp/products/abc123.jpg"
 *                     secure_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/your-cloud/image/upload/v1234/ecommapp/products/abc123.jpg"
 *                     format:
 *                       type: string
 *                       example: "jpg"
 *                     width:
 *                       type: number
 *                       example: 800
 *                     height:
 *                       type: number
 *                       example: 600
 *       400:
 *         description: Bad request - missing file or type
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error while uploading image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to upload image"
 *                 error:
 *                   type: string
 *                   example: "Error message from Cloudinary"
 */

/**
 * @swagger
 * /upload/video:
 *   post:
 *     summary: Upload a video to Cloudinary
 *     description: Uploads a video file to Cloudinary and categorizes it by type (product, user, etc.)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Bearer token for authentication (format- Bearer {token})
 *       - in: header
 *         name: X-CSRF-Token
 *         type: string
 *         required: true
 *         description: CSRF token for protection against cross-site request forgery
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Video file to upload (MP4, MOV, AVI, etc.)
 *       - in: formData
 *         name: type
 *         type: string
 *         required: true
 *         description: Category type (product, user, category)
 *         enum: [product, user, category]
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                       example: "ecommapp/products/video123"
 *                     url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/your-cloud/video/upload/v1234/ecommapp/products/video123.mp4"
 *                     secure_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/your-cloud/video/upload/v1234/ecommapp/products/video123.mp4"
 *                     format:
 *                       type: string
 *                       example: "mp4"
 *                     duration:
 *                       type: number
 *                       example: 15.67
 *       400:
 *         description: Bad request - missing file or type
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Server error while uploading video
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to upload video"
 *                 error:
 *                   type: string
 *                   example: "Error message from Cloudinary"
 */

/**
 * @swagger
 * /upload/{id}:
 *   delete:
 *     summary: Delete an image or video from Cloudinary
 *     description: Deletes an image or video from Cloudinary using its public ID
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         type: string
 *         required: true
 *         description: Bearer token for authentication (format- Bearer {token})
 *       - in: header
 *         name: X-CSRF-Token
 *         type: string
 *         required: true
 *         description: CSRF token for protection against cross-site request forgery
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Public ID of the image or video to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: string
 *                       example: "ok"
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Resource not found - invalid ID
 *       500:
 *         description: Server error while deleting file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to delete image or video"
 *                 error:
 *                   type: string
 *                   example: "Error message from Cloudinary"
 */