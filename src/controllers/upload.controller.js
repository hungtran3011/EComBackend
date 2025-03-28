import cloudinaryService from "../services/cloudinary.service.js";

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