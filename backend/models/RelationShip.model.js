import mongoose from "mongoose";

const RelationShipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "Gaming",
    },
    streamDuration: Number,
    isFollowing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const RelationShip = mongoose.model("RelationShip", RelationShipSchema);
export default RelationShip;