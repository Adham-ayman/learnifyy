import { courseModel } from "../../../DB/models/course.model.js";
import { couponModel } from "../../../DB/models/payment.model.js";
import { roletypes } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";



export const createCoupon = asynchandler(async (req, res, next) => {
    const { code, percentage, expiresAt, courseId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;
  

    const existingCoupon = await couponModel.findOne({ code });
    if (existingCoupon) {
      return next(new Error('Coupon code already exists', { cause: 400 }));
    }
  

    if (userRole === roletypes.instructor) {

      const course = await courseModel.findById(courseId);
      if (!course || course.instructorId.toString() !== userId.toString()) {
        return next(new Error('You can only create coupons for your own courses', { cause: 403 }));
      }
    } else if (userRole ===  roletypes.admin  && courseId) {
        return next(new Error('Global coupons should not be linked to courseId', { cause: 400 }));
    } 
    const newCoupon = await couponModel.create({
      code,
      percentage,
      expiresAt,
      usageLimit: 1,
      createdBy: { userId, role: userRole },
      courseId: userRole ===  roletypes.admin ? null : courseId, 
    });
    if (userRole === roletypes.instructor && courseId) {
        await courseModel.findByIdAndUpdate(courseId, {
          $addToSet: { coupons: newCoupon._id }
        });
      }
  
    return sucessResponse({ res, data: newCoupon, status: 201 });
  });


export const getCoupons = asynchandler(async (req, res, next) => {
  const coupons = await couponModel.find({ isActive: true });

  return sucessResponse({ res, data: coupons, status: 200 });
});

export const getCouponByCode = asynchandler(async (req, res, next) => {
  const { couponCode } = req.params;
  const coupon = await couponModel.findOne({ code: couponCode, isActive: true });

  if (!coupon) {
    return next(new Error('Coupon not found or expired', { cause: 404 }));
  }

  return sucessResponse({ res, data: coupon, status: 200 });
});

export const updateCoupon = asynchandler(async (req, res, next) => {
  const { couponCode } = req.params;
  const { percentage, courseId, expiresAt, isActive } = req.body;

  const coupon = await couponModel.findOne({ code: couponCode });

  if (!coupon) {
    return next(new Error('Coupon not found', { cause: 404 }));
  }

  if (req.user.role === roletypes.instructor) {
    if (coupon.courseId) {
      const course = await courseModel.findById(coupon.courseId);
      if (!course) {
        return next(new Error('Course for this coupon not found', { cause: 404 }));
      }
      // Check if course.instructor exists before calling toString()
      if (course.instructor && course.instructor.toString() !== req.user._id.toString()) {
        return next(new Error('You can only update coupons for your own courses', { cause: 403 }));
      }
    }
  }

  if (req.user.role === roletypes.admin && courseId) {
    return next(new Error('Admin cannot set a courseId for global coupons', { cause: 400 }));
  }

  coupon.percentage = percentage || coupon.percentage;
  coupon.courseId = courseId || coupon.courseId;
  coupon.expiresAt = expiresAt || coupon.expiresAt;
  coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

  await coupon.save();

  if (req.user.role === roletypes.instructor && courseId) {
    await courseModel.findByIdAndUpdate(courseId, {
      $addToSet: { coupons: coupon._id }
    });
  }

  return sucessResponse({ res, data: coupon, status: 200 });
});


export const getInstructorCoupons = asynchandler(async (req, res, next) => {
    const userId = req.user._id;
    
    if (req.user.role !== roletypes.instructor) {
      return next(new Error('Unauthorized access. Only instructors can view their coupons', { cause: 403 }));
    }
  
    const coupons = await couponModel.find({ 
      'createdBy.userId': userId, 
      isActive: true 
    });
  
    if (!coupons || coupons.length === 0) {
      return next(new Error('No active coupons found for your courses', { cause: 404 }));
    }
  
    return sucessResponse({ res, data: coupons, status: 200 });
  });


  export const activateAndDeactivateCoupon = asynchandler(async (req, res, next) => {
    const { couponCode } = req.params;
    const { isActive } = req.body; 
    
    const coupon = await couponModel.findOne({ code: couponCode });
 
    if (!coupon) {
      return next(new Error('Coupon not found', { cause: 404 }));
    }
 
    coupon.isActive = isActive;
    await coupon.save();
 
    return sucessResponse({ res, data: coupon, status: 200 });
 });
 