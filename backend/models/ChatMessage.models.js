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
    },
    reactions:{
        userId:mongoose.Schema.Types.ObjectId,
        ref:"User",
        emoji:String
    },
    status:{
        type:String,
        enum:["Deleiverd","Seen","Unseen"],
        default:"",
        required:true,
    },
    idEdited:{
        type:Boolean,
        required:true,
        default:false,
    },
    isDeleted:{
        type:Boolean,
        required:true,
        default:false,
    },
    moderation:{
        flagged:{
            type:Boolean,
            default:false
        },
        reason:String,
        score:Number,
    }
}, {
    timestamps: true
});
const Chat =mongoose.model("Chat",ChatMessageSchema)
export {Chat}