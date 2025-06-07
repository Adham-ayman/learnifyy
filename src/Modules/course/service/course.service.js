import { create, findAll, findByIdAndDelete, findByIdAndUpdate } from "../../../DB/DB.service.js";
import { courseModel } from "../../../DB/models/course.model.js";
import { roletypes } from "../../../DB/models/user.model.js";
import { deleteMediaFromCloudinary } from "../../../Middleware/deletehelp/cloudinaryhelper.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import cloudinary from "../../../utils/multer/cloudinary.js";
import { paginate } from "../../../Utils/pages/pagination.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";

export const getCourseRatingData = async (courseId) => {
  const result = await feedbackModel.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$courseId',
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
      }
    }
  ]);

  if (!result.length) {
    return { averageRating: 0, totalFeedbacks: 0 };
  }

  const { averageRating, totalFeedbacks } = result[0];
  return {
    averageRating: Number(averageRating.toFixed(2)),
    totalFeedbacks
  };
};


export const createCourse = asynchandler(async (req, res, next) => {
  const instructorId = req.user._id;
  const instructorName = req.user.userName;

  const { title, description, price, totalHours, category, level } = req.body;

  const imageFile = req.files?.image?.[0];
  const introVideoFile = req.files?.introVideo?.[0];

  if (!imageFile || !introVideoFile) {
    return next(
      new Error("Course image and intro video are required", { cause: 400 })
    );
  }

  const imagePath = imageFile.path.replace(/\\/g, "/");
  const videoPath = introVideoFile.path.replace(/\\/g, "/");

  let imageCloud, videoCloud;
  await Promise.all([
    cloudinary.uploader.upload(imagePath, {
      folder: `courses/${instructorName}/${title}/images`,
      resource_type: "image",
    }),
    cloudinary.uploader.upload(videoPath, {
      folder: `courses/${instructorName}/${title}/intro`,
      resource_type: "video",
    }),
  ])
    .then(([imageResult, videoResult]) => {
      imageCloud = imageResult;
      videoCloud = videoResult;
    })
    .catch((error) => {
      console.error("Cloudinary Upload Error:", error);
      return next(
        new Error(`Error uploading files to Cloudinary: ${error.message}`, { cause: 500 })
      );
    });
    if (!imageCloud || !videoCloud) return;
    const isFree = price == 0;
  const newCourse = await create({
    model: courseModel,
    data: {
      title,
      description,
      price,
      isFree,
      totalHours,
      category,
      level,
      instructorId,
      image: {
        secure_url: imageCloud.secure_url,
        public_id: imageCloud.public_id,
      },
      introVideo: {
        secure_url: videoCloud.secure_url,
        public_id: videoCloud.public_id,
      },
    },
  });
  return sucessResponse({ res,message:"Course created successfully",data:newCourse })

});

// export const getAllCourses = asynchandler(async (req, res, next) => {
//   const { search, category, level, price } = req.query;
//   const { page, limit, skip } = paginate(req.query);

//   const filter = {};
//   if (category) filter.category = category;
//   if (level) filter.level = level;
//   if (price) filter.price = price;

//   if (search) {
//     filter.$or = [
//       { title: { $regex: search, $options: "i" } },
//       { description: { $regex: search, $options: "i" } },
//     ];
//   }

//   const courses = await findAll({
//     model: courseModel,
//     filter,
//     limit,
//     skip,
//     select: "-__v",
//     populate: [
//       { path: "instructorId", select: "userName email" },
//       { path: "sectionsId", populate: { path: "lectures", select: "isFreePreview" } },
//       { path: "enrolledUsers", select: "userName email" }, // Populating enrolled users via virtual
//     ],
//   });

//   const total = await courseModel.countDocuments(filter);

//   return sucessResponse({
//     res,
//     data: {
//       courses,
//       pagination: {
//         total,
//         page,
//         limit,
//         pages: Math.ceil(total / limit),
//       },
//     },
//   });
// });
// export const getAllCourses = asynchandler(async (req, res, next) => {
//   const { search, category, level, price, sort } = req.query;
//   const { page, limit, skip } = paginate(req.query);

//   const matchFilter = {};
//   if (category) matchFilter.category = category;
//   if (level) matchFilter.level = level;
//   if (price) matchFilter.price = price;

//   if (search) {
//     matchFilter.$or = [
//       { title: { $regex: search, $options: "i" } },
//       { description: { $regex: search, $options: "i" } },
//     ];
//   }

//   const sortStage = {};

//   if (sort === "ratingDesc") {
//     sortStage.averageRating = -1; 
//   } else if (sort === "ratingAsc") {
//     sortStage.averageRating = 1; 
//   } else {
//     sortStage._id = -1;
//   }

//   const coursesWithRatings = await courseModel.aggregate([
//     { $match: matchFilter },
//     {
//       $lookup: {
//         from: "feedbacks",
//         localField: "_id",
//         foreignField: "courseId",
//         as: "feedbacks",
//       },
//     },
//     {
//       $addFields: {
//         averageRating: { $avg: "$feedbacks.rating" },
//         totalFeedbacks: { $size: "$feedbacks" },
//       },
//     },
//     {
//       $project: {
//         __v: 0,
//         feedbacks: 0,
//       },
//     },
//     { $sort: sortStage },
//     { $skip: skip },
//     { $limit: limit },
//   ]);

//   const total = await courseModel.countDocuments(matchFilter);

//   return sucessResponse({
//     res,
//     data: {
//       courses: coursesWithRatings.map(course => ({
//         ...course,
//         averageRating: course.averageRating ? Number(course.averageRating.toFixed(2)) : 0,
//         totalFeedbacks: course.totalFeedbacks || 0,
//       })),
//       pagination: {
//         total,
//         page,
//         limit,
//         pages: Math.ceil(total / limit),
//       },
//     },
//   });
// });

export const getAllCourses = asynchandler(async (req, res, next) => {
  const { search, category, level, minPrice, maxPrice, sort } = req.query;
  const { page, limit, skip } = paginate(req.query);

  const matchFilter = {};
  if (category) matchFilter.category = category;
  if (level) matchFilter.level = level;
  
  if (minPrice || maxPrice) {
    matchFilter.price = {};
    if (minPrice) matchFilter.price.$gte = Number(minPrice);
    if (maxPrice) matchFilter.price.$lte = Number(maxPrice);
  }

  if (search) {
    matchFilter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sortStage = {};

  if (sort === "ratingDesc") {
    sortStage.averageRating = -1; 
  } else if (sort === "ratingAsc") {
    sortStage.averageRating = 1; 
  } else {
    sortStage._id = -1;
  }

  const coursesWithRatings = await courseModel.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: "feedbacks",
        localField: "_id",
        foreignField: "courseId",
        as: "feedbacks",
      },
    },
    {
      $addFields: {
        averageRating: { $avg: "$feedbacks.rating" },
        totalFeedbacks: { $size: "$feedbacks" },
      },
    },
    {
      $project: {
        __v: 0,
        feedbacks: 0,
      },
    },
    { $sort: sortStage },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await courseModel.countDocuments(matchFilter);

  return sucessResponse({
    res,
    data: {
      courses: coursesWithRatings.map(course => ({
        ...course,
        averageRating: course.averageRating ? Number(course.averageRating.toFixed(2)) : 0,
        totalFeedbacks: course.totalFeedbacks || 0,
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});


export const getCourseById = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await courseModel.findById(courseId)
    .select("-__v")
    .populate([
      { path: "instructorId", select: "userName email" },
      {
        path: "sectionsId",
        populate: {
          path: "lectures",
          select: "isFreePreview",
        },
      },
      { path: "enrolledUsers", select: "userName email" },
    ])
    .lean();

  if (!course) {
    return next(new Error("Course not found", { cause: 404 }));
  }

  const ratingData = await getCourseRatingData(courseId);

  return sucessResponse({
    res,
    data: {
      ...course,
      averageRating: ratingData.averageRating,
      totalFeedbacks: ratingData.totalFeedbacks,
    },
  });
});

export const updateCourse = asynchandler(async (req, res, next) => {
    const  course  = req.course;
  
    if (!course) return next(new Error("Course not found", { cause: 404 }));
  
    const updates = req.body;
    const imageFile = req.files?.image?.[0];
    const introVideoFile = req.files?.introVideo?.[0];
  
    const instructorName = req.user.userName;
    const folderBase = `courses/${instructorName}/${ req.body?.title ? req.body.title:course.title}`;
  
    try {
    if (imageFile) {
        if (course.image?.public_id) {
            await deleteMediaFromCloudinary(course.image, "image");
          }
      const imagePath = imageFile.path.replace(/\\/g, "/");
  
      const imageUpload = await cloudinary.uploader.upload(imagePath, {
        folder: `${folderBase}/images`,
        resource_type: "image",
      });
  
      updates.image = {
        secure_url: imageUpload.secure_url,
        public_id: imageUpload.public_id,
      };
    }
  
    if (introVideoFile) {
        if (course.introVideo?.public_id) {
            await deleteMediaFromCloudinary(course.introVideo, "video");
          }
      const videoPath = introVideoFile.path.replace(/\\/g, "/");
  
      const videoUpload = await cloudinary.uploader.upload(videoPath, {
        folder: `${folderBase}/intro`,
        resource_type: "video",
      });
  
      updates.introVideo = {
        secure_url: videoUpload.secure_url,
        public_id: videoUpload.public_id,
      };
    }
}catch (err) {
    return next(new Error(`Cloudinary upload error: ${err.message}`, { cause: 500 }));
  }
  if ("price" in updates) {
    updates.isFree = updates.price == 0;
  }
    const updatedCourse = await findByIdAndUpdate({model: courseModel,id:course._id,data: updates,select: "-__v", populate: [{ path: "instructorId", select: "userName email" }],});
  
    return sucessResponse({
      res,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  });

export const deleteCourse = asynchandler(async (req, res, next) => {
   
    const course = req.course
    if (!course) return next(new Error("Course not found", { cause: 404 }));
  
    try {
      if (course.image?.public_id) {
        await deleteMediaFromCloudinary(course.image, "image");
      }
  
      if (course.introVideo?.public_id) {
        await deleteMediaFromCloudinary(course.introVideo, "video");
      }
    } catch (err) {
        return next(
            new Error(`Cloudinary cleanup failed: ${err.message}`, { cause: 500  })
          );
    }
  
    await findByIdAndDelete({model:courseModel,id:course._id});
  
    return sucessResponse({
      res,
      message: "Course deleted successfully",
    });
  });

