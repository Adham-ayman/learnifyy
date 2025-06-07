import mongoose, { model, Schema } from "mongoose";



const feedbackSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
  }, { timestamps: true });
  



export const feedbackModel = mongoose.models.Feedback || model("Feedback", feedbackSchema);
