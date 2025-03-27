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
  async uploadImage(filePath, folder) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
      });
      return result;
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }
}

export default new CloudinaryService();