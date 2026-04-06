import mongoose, { Mongoose } from "mongoose";
const RelationShipSchema = new Mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    viewers: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Stream",
        default: 0,
    },
    peakViewers: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Stream",
        default: 0,
    },
    isLive: {
    type: Boolean,
    default: false,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Stream",
    required:true,
    default: "Gaming",
  },
}, { timepstamps: true });
const RelationShip= new Mongoose.model("RelationShip",RelationShipSchema);
export default RelationShip;