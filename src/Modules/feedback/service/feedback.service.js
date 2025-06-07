import { courseModel } from "../../../DB/models/course.model.js";
import { feedbackModel } from "../../../DB/models/feedback.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { paginate } from "../../../Utils/pages/pagination.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";





export const createFeedback = asynchandler(async (req, res, next) => {
    const { courseId} = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id; 
  
    if (!courseId || !rating) {
      return next(new Error("CourseId and Rating are required", { cause: 400 }));
    }
  
    const feedback = await feedbackModel.create({
      userId,
      courseId,
      rating,
      comment,
    });
    await courseModel.findByIdAndUpdate(
        courseId,
        { $addToSet: { feedbacksId: feedback._id } }, 
        { new: true }
      );
  
    return sucessResponse({ res, message: "Feedback created successfully", data: feedback, status: 201 });
  });
  

  export const updateFeedback = asynchandler(async (req, res, next) => {
    const { feedbackId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
  
    const feedback = await feedbackModel.findOneAndUpdate(
      { _id: feedbackId, userId },
      { rating, comment },
      { new: true }
    );
  
    if (!feedback) {
      return next(new Error("Feedback not found or you're not authorized", { cause: 404 }));
    }
  
    return sucessResponse({ res, message: "Feedback updated successfully", data: feedback });
  });
  


  export const deleteFeedback = asynchandler(async (req, res, next) => {
    const { feedbackId } = req.params;
    const userId = req.user._id;
  
    const feedback = await feedbackModel.findOneAndDelete({ _id: feedbackId, userId });
  
    if (!feedback) {
      return next(new Error("Feedback not found or you're not authorized", { cause: 404 }));
    }
    await courseModel.findByIdAndUpdate(
        feedback.courseId,
        { $pull: { feedbacksId: feedback._id } }, 
        { new: true }
      );
  
    return sucessResponse({ res, message: "Feedback deleted successfully" });
  });
  


  export const getCourseFeedbacks = asynchandler(async (req, res, next) => {
    const { courseId } = req.params;
  
    const feedbacks = await feedbackModel.find({ courseId })
      .populate('userId', 'userName email') 
      .sort({ createdAt: -1 });
  
    return sucessResponse({ res, data: feedbacks });
  });
  

  export const getMyFeedbacks = asynchandler(async (req, res, next) => {
    const userId = req.user._id; // اليوزر اللي عامل لوجن
  
    // Pagination support
    const { page, limit, skip } = paginate(req.query);
  
    const totalFeedbacks = await feedbackModel.countDocuments({ userId });
  
    const totalPages = Math.ceil(totalFeedbacks / limit);
  
    const myFeedbacks = await feedbackModel.find({ userId })
      .select('courseId rating comment createdAt')
      .populate({
        path: 'courseId',
        select: 'title price image _id',
      })
      .skip(skip)
      .limit(limit)
      .lean(); // Using lean instead of cursor
  
    return sucessResponse({
      res,
      data: {
        feedbacks: myFeedbacks,
        meta: {
          totalFeedbacks,
          totalPages,
          currentPage: page,
        },
      },
    });
  });
  