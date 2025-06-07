import mongoose, { model, Schema } from "mongoose";




const quizSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  level: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  questionsId: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true });

export const quizModel = mongoose.models.Quiz || model("Quiz", quizSchema);
