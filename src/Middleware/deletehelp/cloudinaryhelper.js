import cloudinary from "../../utils/multer/cloudinary.js";

export const deleteMediaFromCloudinary = async (media) => {
    try {
      if (media?.public_id) {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.resource_type || "image",
        });
      }
    } catch (error) {
      console.warn("Cloudinary cleanup error:", error.message);
      throw new Error("Error cleaning up Cloudinary media.");
    }
  };