import { create, findByIdAndUpdate } from "../../../DB/DB.service.js";
import { lectureModel } from "../../../DB/models/lecture.model.js";
import { sectionModel } from "../../../DB/models/section.model.js";
import { deleteMediaFromCloudinary } from "../../../Middleware/deletehelp/cloudinaryhelper.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import cloudinary from "../../../utils/multer/cloudinary.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";





export const createLecture = asynchandler(async (req, res, next) => {
    const { title, order, duration, isFreePreview, type } = req.body;
    const { sectionId } = req.params;

  
    const videoFile = req.file;
    if (!videoFile) return next(new Error("Lecture video is required", { cause: 400 }));
  
    const section = await sectionModel.findById(sectionId);
    if (!section) return next(new Error("Section not found", { cause: 404 }));
  
    const videoPath = videoFile.path.replace(/\\/g, "/");
    const upload = await cloudinary.uploader.upload(videoPath, {
      folder: `lectures/${sectionId}`,
      resource_type: "video",
    });
  
    const lecture = await create({
      model: lectureModel,
      data: {
        title,
        order,
        duration,
        isFreePreview,
        section: sectionId,
        type,
        videoUrl: upload.secure_url,
        videocloud: {
          secure_url: upload.secure_url,
          public_id: upload.public_id,
        },
      },
    });
  
    await sectionModel.findByIdAndUpdate(sectionId, {
        $addToSet: { lectures: lecture._id },
    });
  
    return sucessResponse({
      res,
      message: "Lecture created successfully",
      data: lecture,
    });
  });
  

  export const updateLecture = asynchandler(async (req, res, next) => {
    const { lectureId } = req.params;
    const updates = req.body;
  
    const lecture = await lectureModel.findById(lectureId);
    if (!lecture) return next(new Error("Lecture not found", { cause: 404 }));
  
    const videoFile = req.file;
    if (videoFile) {
      if (lecture.videocloud?.public_id) {
        await deleteMediaFromCloudinary(lecture.videocloud, "video");
      }
  
      const videoPath = videoFile.path.replace(/\\/g, "/");
      const upload = await cloudinary.uploader.upload(videoPath, {
        folder: `lectures/${lecture.section}`,
        resource_type: "video",
      });
  
      updates.videoUrl = upload.secure_url;
      updates.videocloud = {
        secure_url: upload.secure_url,
        public_id: upload.public_id,
      };
    }
  
    const updatedLecture = await findByIdAndUpdate({
      model: lectureModel,
      id: lectureId,
      data: updates,
    });
  
    return sucessResponse({
      res,
      message: "Lecture updated successfully",
      data: updatedLecture,
    });
  });

  


  export const deleteLecture = asynchandler(async (req, res, next) => {
    const { lectureId } = req.params;
  
    const lecture = await lectureModel.findById(lectureId);
    if (!lecture) return next(new Error("Lecture not found", { cause: 404 }));
  
    await sectionModel.findByIdAndUpdate(lecture.section, {
      $pull: { lectures: lecture._id },
    });
  
    if (lecture.videocloud?.public_id) {
      await deleteMediaFromCloudinary(lecture.videocloud, "video");
    }
  
    await lectureModel.findByIdAndDelete(lecture._id);
  
    return sucessResponse({
      res,
      message: "Lecture deleted successfully",
    });
  });
  

  export const getLecturesBySectionId = asynchandler(async (req, res, next) => {
    const { sectionId } = req.params;
  
    const lectures = await lectureModel
      .find({ section: sectionId })
      .sort("order");
  
    return sucessResponse({
      res,
      data: lectures,
    });
  });
  