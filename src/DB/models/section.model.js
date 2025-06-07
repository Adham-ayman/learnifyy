import mongoose, { model, Schema } from "mongoose";


const sectionCourseSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
      },
      order: {
        type: Number,
        required: true,
      },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course',required: true },
    lectures: [{
        type: Schema.Types.ObjectId,
        ref: "Lecture",
      }],
  }, { timestamps: true });
  


export const sectionModel = mongoose.models.SectionCourse || model("SectionCourse", sectionCourseSchema);
