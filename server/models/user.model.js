import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    onTimeRate: {
      type: Number,
      default: 70,
    },
    acceptanceRate: {
      type: Number,
      default: 75,
    },
    cancellationRate: {
      type: Number,
      default: 5,
    },
    responseTimeScore: {
      type: Number,
      default: 70,
    },
    reliabilityScore: {
      type: Number,
      default: 72,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "",
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
