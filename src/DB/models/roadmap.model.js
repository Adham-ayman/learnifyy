import mongoose, { model, Schema } from "mongoose";

export const roadmapTypes = { basic: "basic", customized: "customized" };
export const categoryTypes = {
  web: "web",
  mobile: "mobile",
  machineLearning: "machineLearning",
  dataScience: "dataScience",
  cybersecurity: "cybersecurity",
  cloudComputing: "cloudComputing",
  devops: "devops",
  AI: "AI",
  gameDevelopment: "gameDevelopment",
};

const roadmapSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    subjects: [
      {
        subjectName: {
          type: String,
          required: true,
          trim: true,
          minlength: 2,
          maxlength: 50,
        },
        order: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    type: {
      type: String,
      enum: Object.values(roadmapTypes),
      default: roadmapTypes.basic,
    },
    category: {
      type: String,
      enum: Object.values(categoryTypes),
    },
    customizedCategory: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
      required: function () {
        return this.type === roadmapTypes.customized;
      },
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      secure_url: {
        type: String,
        required: function () {
          return this.type === roadmapTypes.basic;
        },
      },
      public_id: {
        type: String,
        required: function () {
          return this.type === roadmapTypes.basic;
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roadmapSchema.pre('save', async function (next) {
  const subjects = this.subjects;
  const orders = subjects.map((subject) => subject.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    return next(new Error("Subject orders must be unique within the roadmap"));
  }

  if (this.type === roadmapTypes.basic && !this.category) {
    return next(new Error("Category is required for basic roadmaps"));
  }
  if (this.type === roadmapTypes.customized && !this.customizedCategory) {
    return next(new Error("Customized category is required for customized roadmaps"));
  }
  if (this.type === roadmapTypes.basic && this.customizedCategory) {
    return next(new Error("Customized category should not be set for basic roadmaps"));
  }
  if (this.type === roadmapTypes.customized && this.category) {
    return next(new Error("Category should not be set for customized roadmaps"));
  }

  if (this.type === roadmapTypes.basic && (!this.image?.secure_url || !this.image?.public_id)) {
    return next(new Error("Image is required for basic roadmaps"));
  }

  next();
});

export const roadmapModel = mongoose.models.Roadmap || model("Roadmap", roadmapSchema);