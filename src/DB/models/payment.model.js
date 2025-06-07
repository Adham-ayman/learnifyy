import mongoose, { model, Schema, Types } from "mongoose";
import { roletypes } from "./user.model.js";

export const paymentstatustypes = { pending: "pending",completed:"completed", failed: "failed" , refunded:"refunded"};
export const paymentMethodtypes = { card: "card",upi:"upi", paypal: "paypal" , wallet:"wallet"};
export const paymentGatewaytypes = { stripe: "stripe",paypal:"paypal", razorpay: "razorpay",free:"free"};


const paymentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  courseId: { type: Types.ObjectId, ref: "Course", required: true }, // changed to 1:1 mapping
  amount: { type: Number, required: true }, // final price after discount
  originalPrice: { type: Number }, // optional: for analytics
  discount: {
    couponId: { type: Types.ObjectId, ref: "Coupon" },
    percentage: Number,
    type: { type: String, enum: [ roletypes.admin, roletypes.instructor] }
  },
  status: {
    type: String,
    enum: Object.values(paymentstatustypes),
    default: paymentstatustypes.pending,
  },
  paymentMethod: {
    type: String,
    enum: Object.values(paymentMethodtypes),
  },
  paymentGateway: {
    type: String,
    enum: Object.values(paymentGatewaytypes), 
    default: paymentGatewaytypes.stripe, 
    required: true,
  },
  paymentDetails: { type: Types.ObjectId, ref: "PaymentDetails" },
  transactionId: { type: String, unique: true,sparse: true  },

}, { timestamps: true });

const paymentDetailsSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User" }, // optional, for saving card
  stripeCustomerId: { type: String }, // from Stripe
  paymentMethodId: { type: String }, // Stripe's card ID
  cardLast4: String,
  cardBrand: String,
  expMonth: Number,
  expYear: Number,
  upiId: String, // optional
  paymentGateway: { type: String, default: "stripe" },
  gatewayResponse: Schema.Types.Mixed,
  isSavedCard: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  percentage: { type: Number, required: true },
  courseId: { type: Types.ObjectId, ref: "Course", default: null },
  createdBy: {
    userId: { type: Types.ObjectId, ref: "User" },
    role: { type: String, enum: [ roletypes.admin, roletypes.instructor] }
  },
  usageLimit: { type: Number, required: true ,default: 1 },
  usedBy:[{ type: Types.ObjectId, ref: "User" }],
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  stripeCouponId: { type: String },
}, { timestamps: true });

const enrollmentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ['paid', 'free'],
    default: 'free',
  },
  courseId: { type: Types.ObjectId, ref: "Course", required: true },
  paymentId: { type: Types.ObjectId, ref: "Payment" }, // null for free enrollments
  discount: {
    couponId: { type: Types.ObjectId, ref: "Coupon" }, // Store applied coupon ID
    percentage: { type: Number },
  },
}, { timestamps: true ,toJSON:{virtuals:true},toObject:{virtuals:true}});

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

enrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});



export const paymentModel = mongoose.models.Payment || model("Payment", paymentSchema);
export const paymentDetailsModel = mongoose.models.PaymentDetail || model("PaymentDetail", paymentDetailsSchema);
export const couponModel = mongoose.models.Coupon || model("Coupon", couponSchema);
export const enrollmentModel = mongoose.models.Enrollment || model("Enrollment", enrollmentSchema);


