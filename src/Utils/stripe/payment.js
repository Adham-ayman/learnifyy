import Stripe from "stripe";
import mongoose from "mongoose";
import {
  couponModel,
  enrollmentModel,
  paymentModel,
  paymentstatustypes,
} from "../../DB/models/payment.model.js";
import { userModel } from "../../DB/models/user.model.js";
import { courseModel } from "../../DB/models/course.model.js";
import { progressTrackingModel } from "../../DB/models/progressTracking.model.js";
import { emailevent } from "../events/email.event.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const checkOutSession = async ({
  customer_email,
  mode = "payment",
  cancel_url = process.env.CANCEL_URL,
  success_url = process.env.SUCCESS_URL,
  metadata = {},
  line_items,
  couponCode = null, // 👈 still supporting couponCode
}) => {
  try {
    const sessionOptions = {
      customer_email,
      mode,
      cancel_url,
      success_url,
      metadata,
      line_items,
    };

    if (couponCode) {
      const stripeCouponId = await createStripeCouponIfNeeded(couponCode);
      sessionOptions.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return session;
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    throw new Error(error.message);
  }
};

export const createStripeCouponIfNeeded = async (couponCode) => {
  const couponDoc = await couponModel.findOne({
    code: couponCode,
    isActive: true,
  });

  if (!couponDoc) {
    throw new Error("Invalid or expired coupon");
  }

  if (couponDoc.stripeCouponId) {
    return couponDoc.stripeCouponId; // reuse if exists
  }

  const stripeCoupon = await stripe.coupons.create({
    name: couponDoc.code,
    duration: "once",
    percent_off: couponDoc.percentage,
  });

  couponDoc.stripeCouponId = stripeCoupon.id;
  await couponDoc.save();

  return stripeCoupon.id;
};

export const stripeWebhookHandler = async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
  
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, courseId, paymentId, couponCode } = session.metadata;
        console.log(userId, courseId, paymentId, couponCode);
  
        const transactionId = session.payment_intent;
  
        const payment = await paymentModel.findById(paymentId);
        if (!payment) throw new Error("Payment not found");
  
        payment.status = paymentstatustypes.completed;
        payment.transactionId = transactionId;
  
        const ops = [payment.save()];
  
        // Enrollment, user, and course update
        ops.push(
          (async () => {
            try {
              const enrollment = await enrollmentModel.create({
                userId: new mongoose.Types.ObjectId(userId),
                courseId: new mongoose.Types.ObjectId(courseId),
                status: "paid",
                paymentId: new mongoose.Types.ObjectId(payment._id),
              });
              console.log("✅ Enrollment created");
  
              await userModel.findByIdAndUpdate(userId, {
                $addToSet: { enrolledCourses: enrollment._id },
              });
  
              await courseModel.findByIdAndUpdate(courseId, {
                $addToSet: {
                  enrolledUsersId: new mongoose.Types.ObjectId(userId),
                },
              });
  
              // ✅ Create Progress Tracking after successful enrollment
              const progressExists = await progressTrackingModel.findOne({
                userId,
                courseId,
              });
              if (!progressExists) {
                await progressTrackingModel.create({
                  userId,
                  courseId,
                  completedLecturesId: [],
                });
                console.log("✅ Progress tracking created");
              } else {
                console.log("⚠️ Progress tracking already exists. Skipping.");
              }
            } catch (err) {
              console.error("Error creating enrollment or updating models:", err);
              if (err.code === 11000) {
                console.warn("⚠️ Enrollment already exists. Skipping duplicate.");
              } else {
                throw err;
              }
            }
          })()
        );
  
        if (couponCode) {
          ops.push(
            couponModel.findOneAndUpdate(
              { code: couponCode },
              { $addToSet: { usedBy: new mongoose.Types.ObjectId(userId) } }
            )
          );
        }
  
        // Wait for all operations to complete
        await Promise.all(ops);
        console.log("✅ Payment, Enrollment, and Progress Tracking completed successfully");
  
        // ✅ Send Payment Success Email
        const [user, course] = await Promise.all([
          userModel.findById(userId).lean(),
          courseModel.findById(courseId).lean()
        ]);
  
        if (user && course) {
          emailevent.emit("PaymentSuccess", {
            email: user.email,
            name: user.userName,
            courseTitle: course.title
          });
        }
      }
  
      res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Stripe Webhook Error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  };
  