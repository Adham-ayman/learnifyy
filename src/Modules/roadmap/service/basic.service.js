import { roadmapModel } from "../../../DB/models/roadmap.model.js";
import { userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import cloudinary from "../../../utils/multer/cloudinary.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";

export const validateCreateBasicRoadmap = (req, res, next) => {
  const { title, description, subjects, category } = req.body;
  const imageFile = req.files?.image?.[0];

  if (!title || !subjects || !category || !imageFile) {
    return next(new Error('Title, subjects, category, and image are required', { cause: 400 }));
  }

  let parsedSubjects;
  try {
    parsedSubjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
    if (!Array.isArray(parsedSubjects) || parsedSubjects.length === 0) {
      throw new Error();
    }
    parsedSubjects.forEach(subject => {
      if (!subject.subjectName || typeof subject.order !== 'number' || subject.order < 1) {
        throw new Error();
      }
    });
  } catch (error) {
    return next(new Error('Invalid subjects format: must be an array of {subjectName, order}', { cause: 400 }));
  }

  req.body.subjects = parsedSubjects;
  next();
};

// Create a basic roadmap with image upload
export const createBasicRoadmap = asynchandler(async (req, res, next) => {
  const { title, description, subjects, category } = req.body;
  const creator = req.user._id;
  const creatorName = req.user.userName;
  const imageFile = req.files?.image?.[0];

  const user = await userModel.findById(creator);
  if (!user) {
    return next(new Error('Creator not found', { cause: 404 }));
  }

  let imageCloud;
  try {
    const imagePath = imageFile.path.replace(/\\/g, "/");
    imageCloud = await cloudinary.uploader.upload(imagePath, {
      folder: `roadmaps/${creatorName}/${title}/images`,
      resource_type: "image",
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return next(new Error(`Error uploading image to Cloudinary: ${error.message}`, { cause: 500 }));
  }

  const roadmap = await roadmapModel.create({
    title,
    description,
    subjects,
    type: 'basic',
    category,
    creator,
    image: {
      secure_url: imageCloud.secure_url,
      public_id: imageCloud.public_id,
    },
    isActive: true,
  });

  await userModel.findByIdAndUpdate(
    creator,
    { $addToSet: { createdRoadmaps: roadmap._id } },
    { new: true }
  );

  return sucessResponse({ res, message: 'Basic roadmap created successfully', data: roadmap, status: 201 });
});

export const updateRoadmap = asynchandler(async (req, res, next) => {
  const { roadmapId } = req.params;
  const { title, description, subjects, category, customizedCategory } = req.body;
  const imageFile = req.files?.image?.[0];

  const roadmap = await roadmapModel.findById(roadmapId);
  if (!roadmap) {
    return next(new Error('Roadmap not found', { cause: 404 }));
  }

  let imageData = roadmap.image;
  if (imageFile && roadmap.type === 'basic') {
    try {
      const imagePath = imageFile.path.replace(/\\/g, "/");
      if (roadmap.image?.public_id) {
        await cloudinary.uploader.destroy(roadmap.image.public_id);
      }
      const newImage = await cloudinary.uploader.upload(imagePath, {
        folder: `roadmaps/${req.user.userName}/${title || roadmap.title}/images`,
        resource_type: 'image',
      });
      imageData = {
        secure_url: newImage.secure_url,
        public_id: newImage.public_id,
      };
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return next(new Error(`Error uploading image to Cloudinary: ${error.message}`, { cause: 500 }));
    }
  }

  let parsedSubjects;
  if (subjects) {
    try {
      parsedSubjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
      if (!Array.isArray(parsedSubjects) || parsedSubjects.length === 0) {
        throw new Error();
      }
      parsedSubjects.forEach(subject => {
        if (!subject.subjectName || typeof subject.order !== 'number' || subject.order < 1) {
          throw new Error();
        }
      });
    } catch (error) {
      return next(new Error('Invalid subjects format', { cause: 400 }));
    }
  }

  const updateData = {
    title,
    description,
    subjects: parsedSubjects,
    category: roadmap.type === 'basic' ? category : undefined,
    customizedCategory: roadmap.type === 'customized' ? customizedCategory : undefined,
    image: imageData,
  };

  const updatedRoadmap = await roadmapModel.findByIdAndUpdate(
    roadmapId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return sucessResponse({
    res,
    message: 'Roadmap updated successfully',
    data: updatedRoadmap,
    status: 200
  });
});


export const deleteRoadmap = asynchandler(async (req, res, next) => {
  const { roadmapId } = req.params;

  const roadmap = await roadmapModel.findById(roadmapId);
  if (!roadmap) {
    return next(new Error('Roadmap not found', { cause: 404 }));
  }

  if (roadmap.image?.public_id) {
    try {
      await cloudinary.uploader.destroy(roadmap.image.public_id);
    } catch (error) {
      console.error("Cloudinary Deletion Error:", error);
    }
  }

  await roadmapModel.deleteOne({ _id: roadmapId });

  await userModel.updateMany(
    { $or: [{ createdRoadmaps: roadmapId }, { enrolledRoadmaps: roadmapId }] },
    { $pull: { createdRoadmaps: roadmapId, enrolledRoadmaps: roadmapId } }
  );

  return sucessResponse({ res, message: 'Roadmap deleted successfully', status: 200 });
});


// Enroll in a roadmap
export const enrollInRoadmap = asynchandler(async (req, res, next) => {
  const { roadmapId } = req.params;
  const userId = req.user._id;

  const [roadmap, user] = await Promise.all([
    roadmapModel.findById(roadmapId),
    userModel.findById(userId),
  ]);

  if (!roadmap) {
    return next(new Error('Roadmap not found', { cause: 404 }));
  }
  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  if (user.enrolledRoadmaps.includes(roadmapId)) {
    return next(new Error('User already enrolled in this roadmap', { cause: 400 }));
  }

  await userModel.findByIdAndUpdate(
    userId,
    { $addToSet: { enrolledRoadmaps: roadmapId } },
    { new: true }
  );

  return sucessResponse({ res, message: 'Enrolled in roadmap successfully', data: roadmap, status: 200 });
});

// Get all basic roadmaps
export const getAllBasicRoadmaps = asynchandler(async (req, res, next) => {
  const roadmaps = await roadmapModel.find({ type: 'basic' }).populate('creator', 'userName email');
  return sucessResponse({ res, message: 'Basic roadmaps retrieved successfully', data: roadmaps, status: 200 });
});

// Get roadmap by ID
export const getRoadmapById = asynchandler(async (req, res, next) => {
  const { roadmapId } = req.params;

  const roadmap = await roadmapModel.findById(roadmapId).populate('creator', 'userName email');
  if (!roadmap) {
    return next(new Error('Roadmap not found', { cause: 404 }));
  }

  return sucessResponse({ res, message: 'Roadmap retrieved successfully', data: roadmap, status: 200 });
});

// Search roadmaps
export const searchRoadmaps = asynchandler(async (req, res, next) => {
  const { category, customizedCategory, name } = req.query;
  const query = {};

  if (category) {
    query.category = category;
    query.type = 'basic';
  }
  if (customizedCategory) {
    query.customizedCategory = { $regex: customizedCategory, $options: 'i' };
    query.type = 'customized';
  }
  if (name) {
    query.title = { $regex: name, $options: 'i' };
  }

  const roadmaps = await roadmapModel.find(query).populate('creator', 'userName email');
  return sucessResponse({ res, message: 'Roadmaps retrieved successfully', data: roadmaps, status: 200 });
});

// Get enrolled basic roadmaps
export const getUserEnrolledBasicRoadmaps = asynchandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  const roadmaps = await roadmapModel
    .find({ _id: { $in: user.enrolledRoadmaps }, type: 'basic' })
    .populate('creator', 'userName email');

  return sucessResponse({
    res,
    message: 'User enrolled basic roadmaps retrieved successfully',
    data: roadmaps,
    status: 200,
  });
});