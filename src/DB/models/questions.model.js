import mongoose, { model, Schema } from "mongoose";




const questionSchema = new Schema({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  correctAnswer: { type: String, required: true },
}, { timestamps: true });
  


export const questionModel = mongoose.models.Question || model("Question", questionSchema);
