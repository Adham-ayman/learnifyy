import { create, findByIdAndUpdate, findOne } from "../../../DB/DB.service.js";
import { courseModel } from "../../../DB/models/course.model.js";
import { lectureModel } from "../../../DB/models/lecture.model.js";
import { sectionModel } from "../../../DB/models/section.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";







export const createSection = asynchandler(async (req, res, next) => {
  const { title, order } = req.body;
  const course = req.course

  const existingSection = await  findOne({ model: sectionModel,filter:{ courseId: course._id,order}})

  if (existingSection) {
    return next(new Error(`A section with order number ${order} already exists in this course.`, { cause: 400 }));
  }


  const newSection = await create({
    model: sectionModel,
    data: { title, order, courseId:course._id },
  });

  await courseModel.findByIdAndUpdate(course._id, {
    $addToSet: { sectionsId: newSection._id },
  });

  return sucessResponse({
    res,
    message: "Section created successfully",
    data: newSection,
  });
});

export const updateSection = asynchandler(async (req, res, next) => {
  const { sectionId } = req.params;
  const updates = req.body;

  const section = await sectionModel.findById(sectionId);
  if (!section) {
    return next(new Error("Section not found", { cause: 404 }));
  }
  if (updates.order && updates.order !== section.order) {
    const existingSection = await sectionModel.findOne({
      courseId: section.courseId,
      order: updates.order,
      _id: { $ne: sectionId } 
    });

    if (existingSection) {
      return next(new Error( `Another section in this course already has order number ${updates.order}.`, { cause: 400 }));
    }
  }
  const updatedSection = await findByIdAndUpdate({
    model: sectionModel,
    id: sectionId,
    data: updates,
  });
 

  return sucessResponse({
    res,
    message: "Section updated successfully",
    data: updatedSection,
  });
});

export const deleteSection = asynchandler(async (req, res, next) => {
  const { sectionId ,courseId } = req.params;

  const section = await sectionModel.findById(sectionId);
  if (!section) return next(new Error("Section not found", { cause: 404 }));

  try {
    
    await courseModel.findByIdAndUpdate(courseId, {
      $pull: { sectionsId: section._id },
    });

    const lectures = await lectureModel.find({ section: section._id });
    await Promise.all(
      lectures.map(async (lecture) => {
        if (lecture.videocloud?.public_id) {
          await deleteMediaFromCloudinary(lecture.videocloud, "video");
        }
        await lectureModel.findByIdAndDelete(lecture._id);
      })
    );

    
    await sectionModel.findByIdAndDelete(section._id);

    return sucessResponse({
      res,
      message: "Section and its lectures deleted successfully",
    });
  } catch (err) {
    return next(
      new Error(`Error deleting section: ${err.message}`, { cause: 500 })
    );
  }
});

export const getSectionsByCourseId = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;

  const sections = await sectionModel
    .find({ courseId })
    .populate("lectures")
    .sort("order");

  return sucessResponse({
    res,
    data: sections,
  });
});
