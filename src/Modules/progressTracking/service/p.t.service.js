import { courseModel } from "../../../DB/models/course.model.js";
import { lectureModel } from "../../../DB/models/lecture.model.js";
import { progressTrackingModel } from "../../../DB/models/progressTracking.model.js";
import { sectionModel } from "../../../DB/models/section.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";

export const getProgress = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const progress = await progressTrackingModel
    .findOne({ userId, courseId })
    .populate({
      path: "completedLecturesId",
      select: "title",
    })
    .lean();

  if (!progress) {
    return next(
      new Error("Progress not found for this course", { cause: 404 })
    );
  }

  return sucessResponse({
    res,
    data: progress,
  });
});

export const updateProgress = asynchandler(async (req, res, next) => {
  const { courseId, lectureId } = req.params;
  const userId = req.user._id;
  const { action } = req.body;

  if (!lectureId || !action) {
    return next(new Error("lectureId and action are required", { cause: 400 }));
  }

  const updateOp =
    action === "add"
      ? { $addToSet: { completedLecturesId: lectureId } }
      : action === "remove"
      ? { $pull: { completedLecturesId: lectureId } }
      : null;

  if (!updateOp) {
    return next(
      new Error("Invalid action. Use 'add' or 'remove'", { cause: 400 })
    );
  }

  const progress = await progressTrackingModel.findOneAndUpdate(
    { userId, courseId },
    updateOp,
    { new: true }
  );

  if (!progress) {
    return next(
      new Error("Progress not found for this course", { cause: 404 })
    );
  }

  return sucessResponse({
    res,
    message: `Lecture ${
      action === "add" ? "added to" : "removed from"
    } progress`,
    data: progress,
  });
});

export const deleteProgress = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const progress = await progressTrackingModel.findOneAndDelete({
    userId,
    courseId,
  });
  if (!progress) {
    return next(
      new Error("Progress not found for this course", { cause: 404 })
    );
  }

  return sucessResponse({
    res,
    message: "Progress deleted successfully",
  });
});

export const getAllProgress = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;
  const user = req.user;

  let courseFilter = {};

  if (user.role === "instructor") {
    if (!courseId) {
      return next(
        new Error("courseId is required for instructors", { cause: 400 })
      );
    }

    const course = await courseModel.findById(courseId).select("instructor");
    if (!course) {
      return next(new Error("Course not found", { cause: 404 }));
    }

    if (course.instructorId.toString() !== user._id.toString()) {
      return next(
        new Error("You are not authorized to view progress for this course", {
          cause: 403,
        })
      );
    }

    courseFilter.courseId = courseId;
  } else if (user.role === "admin") {
    if (courseId) {
      courseFilter.courseId = courseId;
    }
  } else {
    return next(new Error("Unauthorized access", { cause: 403 }));
  }

  const progressList = await progressTrackingModel
    .find(courseFilter)
    .populate({
      path: "userId",
      select: "userName email",
    })
    .lean();

  if (!progressList.length) {
    return next(
      new Error("No progress data found for this course", { cause: 404 })
    );
  }

  return sucessResponse({
    res,
    data: progressList,
  });
});

export const getProgressByUser = asynchandler(async (req, res, next) => {
  const userId = req.user._id;

  const progressList = await progressTrackingModel
    .find({ userId })
    .populate({
      path: "courseId",
      select: "title",
    })
    .populate({
      path: "completedLecturesId",
      select: "title",
    })
    .lean();

  if (!progressList.length) {
    return next(new Error("No progress found for this user", { cause: 404 }));
  }

  return sucessResponse({
    res,
    data: progressList,
  });
});

export const getCourseCompletionPercentage = asynchandler(
  async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await progressTrackingModel
      .findOne({ userId, courseId })
      .lean();
    if (!progress) {
      return next(
        new Error("Progress not found for this course", { cause: 404 })
      );
    }

    const sections = await sectionModel.find({ courseId }, "_id").lean();
    const sectionIds = sections.map((sec) => sec._id);

    const lectures = await lectureModel
      .find({ section: { $in: sectionIds } }, "_id")
      .lean();
    const totalLectures = lectures.length;

    if (totalLectures === 0) {
      return next(
        new Error("No lectures found for this course", { cause: 400 })
      );
    }

    const completedCount = progress.completedLecturesId.length;

    const percentage = Math.round((completedCount / totalLectures) * 100);

    return sucessResponse({
      res,
      data: {
        completedLectures: completedCount,
        totalLectures,
        percentage,
      },
    });
  }
);

//   export const getProgress = asynchandler(async (req, res, next) => {
//     const { userId, courseId } = req.params;
//     const { summary } = req.query;

//     const progress = await progressTrackingModel
//       .findOne({ userId, courseId })
//       .populate(summary === 'true' ? '' : {
//         path: 'completedLecturesId',
//         select: 'title'
//       })
//       .lean();

//     if (!progress) {
//       return next(new Error("Progress not found for this course", { cause: 404 }));
//     }

//     if (summary === 'true') {
//       const sections = await sectionCourseModel.find({ courseId }, "_id").lean();
//       const sectionIds = sections.map((sec) => sec._id);

//       const lectures = await lectureModel.find({ section: { $in: sectionIds } }, "_id").lean();
//       const totalLectures = lectures.length;

//       if (totalLectures === 0) {
//         return next(new Error("No lectures found for this course", { cause: 400 }));
//       }

//       const completedCount = progress.completedLecturesId.length;
//       const percentage = Math.round((completedCount / totalLectures) * 100);

//       return sucessResponse({
//         res,
//         data: {
//           completedLectures: completedCount,
//           totalLectures,
//           percentage,
//         },
//       });
//     }

//     // 3. Return progress with lecture titles
//     return sucessResponse({
//       res,
//       data: progress,
//     });
//   });
