import cloudinaryService from "../../common/services/cloudinary.service.js";

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
const uploadImage = async (req, res) => {
  try {
    // type can be product, user, etc
    const { file, type } = req;
    const result = await cloudinaryService.uploadImage(file.path, type);
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
}

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
const uploadVideo = async (req, res) => {
  try {
    // type can be product, user, etc
    const { file, type } = req;
    const result = await cloudinaryService.uploadVideo(file.path, type);
    res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      data: result,
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to upload video",
      error: error.message,
    });
  }
}

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
const deleteImageOrVideo = async (req, res) => {
  try {
    const {id} = req;
    const result = await cloudinaryService.deleteImageOrVideo(id)
    res.status(201).json({
      success: true,
      message: "Deleted successfully",
      data: result,
    })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image or video",
      error: error.message,
    });
  }
}

const UploadController = {
  uploadImage,
  uploadVideo,
  deleteImageOrVideo
}

export default UploadController