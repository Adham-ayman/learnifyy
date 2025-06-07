import mongoose, { model, Schema } from "mongoose";

export const roletypes = { user: "user",instructor:"instructor", admin: "admin" };
export const gendertypes = { male: "male", female: "female" };
export const providertypes = { system: "system", google: "google" };

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      maxlength: 30,
      minlength: 2,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: Object.values(gendertypes),
      default: gendertypes.male,
    },
    role: {
      type: String,
      enum: Object.values(roletypes),
      default: roletypes.user,
    },
    provider: {
      type: String,
      enum: Object.values(providertypes),
      default: providertypes.system,
    },
    
    DOB:Date,
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    image:{secure_url:String,public_id:String},
    // imageURL:String,
    endSessionTime: Date,
    forgetPasswordOtp: String,
    confirmEmailOtp: String,
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Enrollment' }],
    createdRoadmaps: [{ type: Schema.Types.ObjectId, ref: 'Roadmap' }],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdRoadmaps: [{ type: Schema.Types.ObjectId, ref: 'Roadmap' }],
    enrolledRoadmaps: [{ type: Schema.Types.ObjectId, ref: 'Roadmap' }],
    studyPlans: [
  {
    subjects: [String],
    goals: String,
    schedule: String,
    plan: [
      {
        weekTitle: String,
        days: [
          {
            day: String,
            tasks: [String],
          },
        ],
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
]
  },
  { 
    timestamps: true ,
    toJSON: { virtuals: true },  
    toObject: { virtuals: true }
  }
);
userSchema.virtual('firstName')
  .get(function() {
    return this.userName?.split(' ')[0] || '';
  })
  .set(function(v) {
    const lastName = this.lastName || this.userName?.split(' ').slice(1).join(' ') || '';
    this.userName = `${v} ${lastName}`.trim();
  });

userSchema.virtual('lastName')
  .get(function() {
    const parts = this.userName?.split(' ') || [];
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  })
  .set(function(v) {
    const firstName = this.firstName || this.userName?.split(' ')[0] || '';
    this.userName = `${firstName} ${v}`.trim();
  });


userSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName') || this.isNew) {
    if (this.firstName || this.lastName) {
      this.userName = `${this.firstName || ''} ${this.lastName || ''}`
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
    }
  }
  next();
});

export const userModel = mongoose.models.User || model("User", userSchema);
export const socketConnections = new Map()
