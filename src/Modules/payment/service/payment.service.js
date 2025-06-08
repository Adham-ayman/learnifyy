import { courseModel } from "../../../DB/models/course.model.js";
import {
  couponModel,
  enrollmentModel,
  paymentGatewaytypes,
  paymentModel,
  paymentstatustypes,
} from "../../../DB/models/payment.model.js";
import { progressTrackingModel } from "../../../DB/models/progressTracking.model.js";
import { userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { checkOutSession } from "../../../Utils/stripe/payment.js";

export const createCheckoutSession = asynchandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { couponCode } = req.body;
  const userId = req.user._id;

  const course = await courseModel.findById(courseId);
  if (!course) {
    return next(new Error("Course not found", { cause: 404 }));
  }

  const user = await userModel.findById(userId);

  if (user.enrolledCourses?.includes(courseId)) {
    return sucessResponse({
      res,
      message: "Already enrolled in this course.",
      status: 200,
    });
  }

  let price = course.price;
  let originalPrice = price;
  let couponDoc,
    discountPercentage = 0;

  if (couponCode) {
    couponDoc = await couponModel.findOne({ code: couponCode, isActive: true });
    if (!couponDoc) {
      return next(new Error("Invalid or expired coupon", { cause: 400 }));
    }
    if (couponDoc.courseId && couponDoc.courseId.toString() !== courseId) {
      return next(
        new Error("Coupon not valid for this course", { cause: 400 })
      );
    }
    if (couponDoc.usedBy.includes(userId.toString())) {
      return next(
        new Error("You have already used this coupon", { cause: 400 })
      );
    }
    discountPercentage = couponDoc.percentage || 0;
    price = Math.round(price * (1 - discountPercentage / 100));
  }

  if (price === 0) {
    const enrollment = await enrollmentModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      status: "free",
      paymentId: null,
    });

    await userModel.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: enrollment._id },
    });
    await courseModel.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledUsersId: userId },
    });
    const progressExists = await progressTrackingModel.findOne({ userId, courseId });
    if (!progressExists) {
      await progressTrackingModel.create({
        userId,
        courseId,
        completedLecturesId: [],
      });
      console.log(" Progress tracking created for free course");
    }
    return sucessResponse({
      res,
      message: "Enrolled successfully into free course!",
      status: 201,
    });
  }

  const payment = await paymentModel.create({
    userId,
    courseId,
    originalPrice,
    amount: price,
    status: paymentstatustypes.pending,
    paymentGateway: paymentGatewaytypes.stripe,
    ...(couponDoc && {
      discount: {
        couponId: couponDoc._id,
        percentage: discountPercentage,
        type: couponDoc.createdBy.role,
      },
    }),
  });

  // Line items for Stripe
  const line_items = [
    {
      price_data: {
        currency: "egp",
        product_data: {
          name: course.title,
          images: [course.image?.secure_url || ""],
        },
        unit_amount: price * 100, // Stripe uses cents
      },
      quantity: 1,
    },
  ];

  // Metadata
  const metadata = {
    userId: userId.toString(),
    courseId: courseId.toString(),
    paymentId: payment._id.toString(),
    couponCode: couponCode,
  };

  const session = await checkOutSession({
    customer_email: req.user.email,
    line_items,
    metadata,
    couponCode: couponCode || null, 
  });
  return sucessResponse({ res, data: { url: session.url }, status: 201 });
});
