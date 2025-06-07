import mongoose, { model, Schema } from "mongoose";




const progressTrackingSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    completedLecturesId: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }],
  }, { timestamps: true });
  


export const progressTrackingModel = mongoose.models.ProgressTracking || model("ProgressTracking", progressTrackingSchema);
