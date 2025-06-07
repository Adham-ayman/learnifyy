import mongoose, { model, Schema } from "mongoose";

export const contentTypes = { video: "video",article:"article", quiz: "quiz" };

const lectureSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
      },
      order: {
        type: Number,
        required: true
      },
      duration:String,
      isFreePreview: {
        type: Boolean,
        default: false,
      },
      videoUrl: {
        type: String,
      },
      videocloud: {
        secure_url: { type: String },
        public_id: { type: String },
      },
      type: {
        type: String,
        enum: Object.values(contentTypes),
        default: contentTypes.video,
      },
    section: {
      type: Schema.Types.ObjectId,
      ref: "SectionCourse",
      required: true
    },
  }, { timestamps: true });


  export const lectureModel = mongoose.models.Lecture || model("Lecture", lectureSchema);