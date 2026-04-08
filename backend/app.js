import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./route/user.route.js";
import streamRoutes from "./route/stream.route.js";
import profileRoutes from "./route/profile.route.js";
import paymentRoutes from "./route/payment.route.js";
import analyticsRoutes from "./route/analytics.route.js";
import FolllowerRoutes from "./route/follower.route.js"
import cors from "cors";
import social from "./route/Social.controller.js"
import { clerkMiddleware } from "@clerk/express";
import { generateChatResponse } from "./controller/gemini.controller.js";
const app = express();
app.use(cors({
  origin: "*",
  credentials: true
}));
// middleware
app.use(express.json());
app.use(clerkMiddleware());
// routes
app.use("/api/auth", authRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api", profileRoutes);
app.use("/api/gemini", generateChatResponse);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/follower",FolllowerRoutes);
app.use("/api/social",social);
app.get("/api/analytics/report/:userId", (req, res) => {
  console.log("✅ REPORT API HIT");
  res.json({ ok: true });
});
// DB connection
export default app;
