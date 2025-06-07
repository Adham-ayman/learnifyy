import mongoose, { model, Schema } from "mongoose";

export const statustypes = { pending: "pending",inProgress:"in-progress", completed: "completed" };
export const prioritytypes = { low: "low",medium:"medium", high: "high" };




const taskSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
      },
      title: {
        type: String,
        required: true,
        maxlength: 100,
      },
      description: {
        type: String,
        maxlength: 500,
      },
      dueDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(statustypes),
        default: statustypes.pending,
      },
      priority: {
        type: String,
        enum: Object.values(prioritytypes),
        default: prioritytypes.medium,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      reminderSent: {
        type: Boolean,
        default: false
      }
  }, { timestamps: true });
  


export const taskModel = mongoose.models.Task || model("Task", taskSchema);
