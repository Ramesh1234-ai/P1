import express from "express"
import cors from "cors";
import mongoose from "mongoose";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import dotenv from "dotenv"
import PaymentRoutes from "../route/payment.route.js";
import AnalyticsRoutes from "../route/analytics.route.js";

dotenv.config()
export const app = express()
app.use(cors());
// middleware
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use("/api/payment", PaymentRoutes);
app.use("/api/analytics", AnalyticsRoutes);

app.get("/",(req,res)=>{
  res.send("Hello World").status(201);
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));