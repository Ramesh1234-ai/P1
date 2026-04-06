import mongoose from "mongoose";
const ChatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    chatMessage: {
        required: true,
        type: String,
        default: " ",
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stream"
    },
    file: {
        type: String,
        default: "",
    },
    fileurl: {
        type: String,
        default: "",
    }
}, {
    timestamps: true
});
const Chat =mongoose.model("Chat",ChatMessageSchema)
export {Chat}