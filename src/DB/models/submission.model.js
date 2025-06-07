import mongoose, { model, Schema } from "mongoose";





const submissionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  answers: [
    {
      questionId: {
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
    },
  ],
  score: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

submissionSchema.index({ userId: 1, quizId: 1, submittedAt: 1 });


export const submissionModel = mongoose.models.Submission || model("Submission", submissionSchema);
