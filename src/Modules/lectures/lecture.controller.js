import { Router } from "express";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import { roletypes } from "../../DB/models/user.model.js";
import { isCourseInstructor } from "../../Middleware/CheckRole/checkRole.js";
import { uploadCloudFile } from "../../Utils/multer/multer.cloud.js";
import { fileValidationTypes } from "../../Utils/multer/local/multer.local.js";
import  * as lectureService from "./service/lecture.service.js";
import { validation } from "../../Middleware/validation/validation.js";




const lectureRouter = Router({ mergeParams: true });



lectureRouter.post(
    "/create",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor,
    uploadCloudFile(fileValidationTypes.video).single("video"),
    lectureService.createLecture
  );
  
  lectureRouter.get(
    "/",
    authentication(),
    authorization([roletypes.instructor, roletypes.admin]),
    lectureService.getLecturesBySectionId
  );
  
  lectureRouter.put(
    "/:lectureId",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor,
    uploadCloudFile(fileValidationTypes.video).single("video"),
    lectureService.updateLecture
  );
  
  lectureRouter.delete(
    "/:lectureId",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor,
    lectureService.deleteLecture
  );
  
export default lectureRouter;