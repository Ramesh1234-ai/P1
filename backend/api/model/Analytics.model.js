import mongoose from "mongoose";
const AnalyticsSchema = new mongoose.Schema({
  // 👤 Creator & Timestamps
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // 📈 Analytics
  totalViewers: {
    type: Number,
    default: 0,
  },
  averageViewtime: {
    type: Number,
    default: 0, // in seconds
  },
  timeRange: {
    type: Number,
    enum: ["7Days", "30days", "90Days"],
    default:[]
  },
  ChatMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat"
  },
  duration: {
    type: number,
    default: 0,
    required: true
  },
  title: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stream"
  },
  viewers: {
    type: Number,
    default: 0,
  },
  peakViewers: {
    type: Number,
    default: 0,
  },
  viewersList: [{
    username: String,
    joinedAt: Date,
    socketId: String,
  }],
}, { timestamps: true });
// Update peak viewers when viewers count changes
streamSchema.methods.updateMetrics = function (currentViewers) {
  if (currentViewers > this.peakViewers) {
    this.peakViewers = currentViewers;
  }
};
const Analytics = mongoose.model("Analytics", AnalyticsSchema)
export { Analytics }