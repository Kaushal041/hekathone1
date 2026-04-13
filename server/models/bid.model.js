import mongoose from "mongoose";

const { Schema } = mongoose;

const BidSchema = new Schema(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    workerId: {
      type: String,
      required: true,
      index: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedTime: {
      type: String,
      required: true,
    },
    proposal: {
      type: String,
      required: true,
      minlength: 10,
    },
    performanceScore: {
      type: Number,
      default: 0,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    skillMatchScore: {
      type: Number,
      default: 0,
    },
    priceScore: {
      type: Number,
      default: 0,
    },
    locationScore: {
      type: Number,
      default: 0,
    },
    aiScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Bid", BidSchema);
