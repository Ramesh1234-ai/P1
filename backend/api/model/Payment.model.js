import mongoose from "mongoose";
const PaymentSchema =new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    amount:{
        type:Number,
        currencey:"",
        default:" ",
        required:true,
    },
    payment_Method:{
        type:String,
       default:[],
       enum:["upi","card","Wallet"]
    },
    Payment_Status:{
        type:String,
        default:[],
        enum:["pending","success","failed"]
    },
    receiverid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        lowercase:true,
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    transcationAmount:{
        type:Number,
        required:true,
        default:0
    }
},{timestamps:true});
const Payment =mongoose.model("Payment",PaymentSchema)
export {Payment}