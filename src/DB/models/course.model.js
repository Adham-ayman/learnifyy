import mongoose, { model, Schema } from "mongoose";

export const leveltypes = { beginner: "beginner",medium:"medium", master: "master" };
export const categorytypes = { web: "web",mobile:"mobile", AI: "AI" ,devops:"devops",game:"game",design:"design" };


const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        default: 0,
      },
      totalHours: {
        type: Number,
        default: 0,
      },
      category:[{
        type: String,
          enum: Object.values(categorytypes),
      }],
    level: {
          type: String,
          enum: Object.values(leveltypes),
          default: leveltypes.medium,
        },
    viewers: {
        type: Number,
        default: 0,
      },
      isFree: {
        type: Boolean,
        default: false,
      },
    introVideo:{secure_url:String,public_id:String},
    image: {secure_url:String,public_id:String},
    instructorId: { type: Schema.Types.ObjectId, ref: 'User',required: true, },
    sectionsId: [{ type: Schema.Types.ObjectId, ref: 'SectionCourse' }],
    enrolledUsersId: [{ type: Schema.Types.ObjectId, ref: "User" }],
    feedbacksId: [{ type: Schema.Types.ObjectId, ref: 'Feedback' }],
    couponsId: [{ type: Schema.Types.ObjectId, ref: "Coupon" }]
  }, { timestamps: true,toJSON:{virtuals:true},toObject:{virtuals:true }});
  
  courseSchema.pre("save", function (next) {
    this.isFree = this.price === 0;
    next();
  });
  courseSchema.virtual('enrolledUsers', {
    ref: 'User',
    localField: 'enrolledUsersId',
    foreignField: '_id',
  });
  courseSchema.virtual('instructor', {
    ref: 'User',
    localField: 'instructorId',
    foreignField: '_id',
    justOne: true,
  });
  
  courseSchema.virtual('sections', {
    ref: 'SectionCourse',
    localField: 'sectionsId',
    foreignField: '_id',
  });
  
  courseSchema.virtual('feedbacks', {
    ref: 'Feedback',
    localField: 'feedbacksId',
    foreignField: '_id',
  });
  
  courseSchema.virtual('coupons', {
    ref: 'Coupon',
    localField: 'couponsId',
    foreignField: '_id',
  });

export const courseModel = mongoose.models.Course || model("Course", courseSchema);
