import mongoose, { model, Schema } from "mongoose";





const answerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
}, { timestamps: true });

answerSchema.index({ user: 1, quiz: 1, question: 1 }, { unique: true });


  export const answerModel = mongoose.models.Answer || model("Answer", answerSchema);
  