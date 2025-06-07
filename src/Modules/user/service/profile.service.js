import { updateOne } from "../../../DB/DB.service.js";
import { enrollmentModel } from "../../../DB/models/payment.model.js";
import { userModel } from "../../../DB/models/user.model.js";
import { deleteMediaFromCloudinary } from "../../../Middleware/deletehelp/cloudinaryhelper.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { emailevent } from "../../../Utils/events/email.event.js";
import cloudinary from "../../../utils/multer/cloudinary.js";
import { paginate } from "../../../Utils/pages/pagination.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { decrpytion, encryption } from "../../../Utils/security/encryption/encrypt.js";
import { comparehash, hashing } from "../../../Utils/security/hashing/hash.js";


export const getProfile = asynchandler(async (req, res, next) => {
  const user = req.user;

  const studyPlan = user.studyPlans || [];
  const studyPlans = studyPlan?.map(plan => ({
      id: plan._id,
      subjects: plan.subjects,
      goals: plan.goals,
      plan:plan.plan,
      schedule: plan.schedule,
      createdAt: plan.createdAt
    }))
    const phone = await decrpytion({cibertext:user.phone})
  const profileData = {
    firstName: user.firstName, 
    lastName: user.lastName,   
    userName:user.userName,
    email: user.email,
    role: user.role,
    image: user.image?.secure_url || null, 
    gender: user.gender,
    DOB: user.DOB,
    studyPlans,
    phone,
    enrolledCoursesCount: user.enrolledCourses?.length || 0,
    createdRoadmapsCount: user.createdRoadmaps?.length || 0,
  };
  return sucessResponse({
    res,
    data: profileData
  });
});


export const updateProfile = asynchandler(async (req, res, next) => {
  const { firstName, lastName, phone, removeImage } = req.body;
  const updateData = {};
  const unsetFields = {};


  if (firstName || lastName) {
    
    const currentUser = await userModel.findById(req.user._id);
    const currentFirstName = currentUser.firstName || '';
    const currentLastName = currentUser.lastName || '';

  
    const newFirstName = firstName || currentFirstName;
    const newLastName = lastName || currentLastName;


    updateData.userName = `${newFirstName} ${newLastName}`.trim().replace(/\s+/g, ' ');
  }

  if (phone) {
    const encryptedPhone = await encryption({ plaintext: phone });
    if (encryptedPhone !== req.user.phone) {
      const existingPhone = await userModel.findOne({ phone: encryptedPhone });
      if (existingPhone) {
        return next(new Error("Phone number already in use", { cause: 409 }));
      }
      updateData.phone = encryptedPhone;
    }
  }

  if (removeImage === "true" || removeImage === true) {
    if (req.user.image?.public_id) {
      await deleteMediaFromCloudinary(req.user.image, "image");
      unsetFields.image = "";
      unsetFields.imageURL = "";
    } else {
      unsetFields.image = "";
      unsetFields.imageURL = "";
    }
  }

  if (req.file) {
    if (req.user.image?.public_id) {
      await deleteMediaFromCloudinary(req.user.image, "image");
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "profile-pics",
      }
    );

    updateData.image = { secure_url, public_id };
  }

  const finalUpdate = {
    ...(Object.keys(updateData).length > 0 && { $set: updateData }),
    ...(Object.keys(unsetFields).length > 0 && { $unset: unsetFields }),
  };

  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    finalUpdate,
    {
      new: true,
      select: "firstName lastName phone image userName",
    }
  );

  return sucessResponse({
    res,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const changePassword = asynchandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (currentPassword == newPassword) {
    return next(
      new Error("Current password is same as old one", { cause: 400 })
    );
  }

  const match = await comparehash({
    pass: currentPassword,
    hashedvalue: user.password,
  });
  if (!match) {
    return next(new Error("Current password is incorrect", { cause: 400 }));
  }

  const hashedPassword = await hashing({ pass: newPassword });
  await updateOne({
    model: userModel,
    filter: { _id: user._id, isActive: true },
    data: { endSessionTime: Date.now(), $set: { password: hashedPassword } },
  });
  emailevent.emit("PasswordChanged", { email: user.email });
  return sucessResponse({
    res,
    data: { message: "Password updated successfully" },
  });
});

export const getEnrolledCourses = asynchandler(async (req, res, next) => {
  const userId = req.user._id;

  const { page, limit, skip } = paginate(req.query);

  const totalCoursesCount = await enrollmentModel.countDocuments({ userId });

  const totalPages = Math.ceil(totalCoursesCount / limit);

  const enrolledCourses = await userModel
    .findById(userId)
    .select("enrolledCourses")
    .populate({
      path: "enrolledCourses",
      select: "courseId status",
      options: {
        skip,
        limit,
      },
      populate: {
        path: "courseId",
        select: "title price image _id",
      },
    })
    .lean()
    .then((user) => {
      return user.enrolledCourses.map((enrollment) => ({
        course: {
          _id: enrollment.courseId._id,
          title: enrollment.courseId.title,
          price: enrollment.courseId.price,
          image: enrollment.courseId.image,
        },
        status: enrollment.status,
      }));
    });

  return sucessResponse({
    res,
    data: {
      enrolledCourses,
      pagination: {
        totalCoursesCount,
        totalPages,
        currentPage: page,
      },
    },
    status: 200,
  });
});

export const deactivateAccount = asynchandler(async (req, res, next) => {
  await updateOne({
    model: userModel,
    filter: { _id: req.user._id },
    data: { endSessionTime: Date.now(), $set: { isActive: false } },
  });

  return sucessResponse({
    res,
    message: "Account deactivated successfully",
  });
});
