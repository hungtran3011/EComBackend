import cloudinaryService from "../../common/services/cloudinary.service.js";


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