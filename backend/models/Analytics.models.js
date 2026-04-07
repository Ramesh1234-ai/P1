import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema(
  {
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalViewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0, // in minutes
    },
    totalWatchTime: {
      type: Number,
      default: 0, // in minutes
    },
    views: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0, // percentage
    },
    category: String,
    streamDate: Date,
    streamDuration: Number, // in minutes
    followersGained: {
      type: Number,
      default: 0,
    },
    followersLost: {
      type: Number,
      default: 0,
    },
    chatMessages: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    deviceTypes: {
      mobile: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
    },
    regions: [
      {
        country: String,
        viewers: Number,
      },
    ],
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", AnalyticsSchema);
export default Analytics;
