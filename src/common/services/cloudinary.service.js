import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

class CloudinaryService {
  /**
   * Uploads an image to Cloudinary
   * @param {string} filePath - The path to the image file
   * @param {string} folder - The destination folder in Cloudinary
   * @returns {Promise<Object>} The upload result containing the image details
   * @throws {Error} If the image upload fails
   */
  async uploadImage(filePath, folder) {
    try {
      if (!filePath) {
        throw new Error('File path is required');
      }
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
      });
      return result;
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  async deleteImageOrVideo(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Media deletion failed: ${error.message}`);
    }
  }

  /**
   * Uploads a video to Cloudinary
   * @param {string} filePath - The path to the video file
   * @param {string} folder - The destination folder in Cloudinary
   * @returns {Promise<Object>} The upload result containing the video details
   * @throws {Error} If the video upload fails
   */
  async uploadVideo(filePath, folder) {
    try {
      if (!filePath) {
        throw new Error('File path is required');
      }
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        folder: folder,
      });
      return result;
    } catch (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }
}

export default new CloudinaryService();