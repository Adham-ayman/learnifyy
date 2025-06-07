import { courseModel } from "../../DB/models/course.model.js";
import { roletypes } from "../../DB/models/user.model.js";
import { asynchandler } from "../../Utils/errors/errorhandeler.js";

export const isInstructorOrAdmin = asynchandler(async (req, res, next) => {
  const instructorId = req.user._id;
  const { courseId } = req.params;
  const course = await courseModel.findById(courseId);
  if (!course) {
    return next(new Error("Course not found", { cause: 404 }));
  }

  if (
    course.instructorId.toString() !== instructorId.toString() &&
    req.user.role !== roletypes.admin
  ) {
    return next(
      new Error("Not authorized to modify this course", { cause: 403 })
    );
  }
   req.course = course
  return next();
});

export const isCourseInstructor = asynchandler(async (req, res, next) => {
    const instructorId = req.user._id;
    const { courseId } = req.params;
  
    const course = await courseModel.findById(courseId);
    if (!course) {
      return next(new Error("Course not found", { cause: 404 }));
    }
  
    if (course.instructorId.toString() !== instructorId.toString()) {
      return next(new Error("You are not the instructor of this course", { cause: 403 }));
    }
  
    req.course = course; 
    return next();
  });
