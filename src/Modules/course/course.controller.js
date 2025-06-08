import { Router } from "express";
import * as courseService from "./service/course.service.js";
import {
  authentication,
  authorization,
} from "../../Middleware/authentication/authentication.js";
import { roletypes } from "../../DB/models/user.model.js";
import { uploadCloudFile } from "../../Utils/multer/multer.cloud.js";
import { fileValidationTypes } from "../../Utils/multer/local/multer.local.js";
import { validation } from "../../Middleware/validation/validation.js";
import * as validators from "./course.validation.js";
import { isCourseInstructor, isInstructorOrAdmin } from "../../Middleware/CheckRole/checkRole.js";
import sectionRouter from "../sectionCourse/section.controller.js";
import paymentRouter from "../payment/payment.controller.js";
import feedbackRouter from "../feedback/feedback.controller.js";
import progressTrackingRouter from "../progressTracking/progressTracking.controller.js";

const courseRouter = Router();

courseRouter.use('/:courseId/section',sectionRouter)
courseRouter.use('/:courseId/checkout',paymentRouter)
courseRouter.use('/:courseId/feedback',feedbackRouter)
courseRouter.use('/:courseId/progress',progressTrackingRouter)




courseRouter.post(
  "/create",
  authentication(),
  authorization([roletypes.instructor,roletypes.admin]),
  uploadCloudFile(fileValidationTypes.mix).fields([
    { name: "image", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
  ]),
  validation(validators.createCourse),
  courseService.createCourse
);

courseRouter.get("/all", courseService.getAllCourses);
courseRouter.get("/:courseId", courseService.getCourseById);

courseRouter.put(
    "/:courseId",
    authentication(),
    authorization([roletypes.instructor]),
    isCourseInstructor,
    uploadCloudFile(fileValidationTypes.mix).fields([
      { name: "image", maxCount: 1 },
      { name: "introVideo", maxCount: 1 },
    ]),
    courseService.updateCourse
  );

  courseRouter.delete(
    "/:courseId",
    authentication(),
    authorization([roletypes.instructor, roletypes.admin]),
    isInstructorOrAdmin,
    courseService.deleteCourse
  );

export default courseRouter;
