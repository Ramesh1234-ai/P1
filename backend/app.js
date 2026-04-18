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
import { clerkSetupDiagnostics, logClerkAuth } from "./middleware/clerk-diagnostics.js";
import { requestLogger, checkDBConnection } from "./middleware/request-logger.js";
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per 15 min
  message: "Too many requests, please try again later"
});
const app = express();
// ✅ Run diagnostics on startup
clerkSetupDiagnostics();
// ✅ CORS middleware — must be first
app.use(cors({
  origin: [process.env.CORS_ORIGIN,"https://echo-rizz.vercel.app"],
  credentials: true
}));
// ✅ Body parser middleware
app.use(express.json());

// ✅ NEW: Request timing & duration logger
app.use(requestLogger);

// ✅ Clerk authentication middleware (MUST be before routes)
app.use(clerkMiddleware());

// ✅ Log Clerk auth results for debugging
app.use(logClerkAuth);

// ✅ NEW: Check if MongoDB is connected before processing API calls
app.use(checkDBConnection);

// ==================== ROUTES ====================
app.use("/api/v1/auth",limiter,authRoutes);
app.use("/api/v1//streams",limiter, streamRoutes);
app.use("/api/v1/profile",limiter, profileRoutes);
app.use("/api/v1/gemini",limiter, generateChatResponse);
app.use("/api/v1/payment",limiter, paymentRoutes);
app.use("/api/v1/analytics",limiter, analyticsRoutes);
app.use("/api/v1/follower",limiter, FolllowerRoutes);
app.use("/api/v1/social",limiter, social);

// ==================== DIAGNOSTIC ENDPOINTS ====================
/**
 * DEBUG: Check Clerk token validation
 * Access at: http://localhost:5000/api/auth/debug/setup
 */
app.get("/api/auth/debug/setup", (req, res) => {
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  const hasPublishableKey = !!process.env.CLERK_PUBLISHABLE_KEY;
  res.json({
    success: true,
    clerkConfiguration: {
      CLERK_SECRET_KEY_configured: hasSecretKey,
      CLERK_PUBLISHABLE_KEY_configured: hasPublishableKey,
      message: hasSecretKey && hasPublishableKey
        ? "✅ Clerk is configured correctly"
        : "❌ Missing configuration. Check backend .env"
    }
  });
});
/**
 * DEBUG: Test token validation
 * Access at: http://localhost:5000/api/auth/debug/me
 * Requires: Authorization: Bearer <token>
 */
app.get("/api/auth/debug/me", (req, res) => {
  res.json({
    success: true,
    debug: {
      tokenReceived: !!req.headers.authorization,
      tokenValidated: !!req.auth,
      clerkUserId: req.auth?.userId || null,
      clerkEmail: req.auth?.email || null,
      fullAuth: req.auth || null,
      message: req.auth?.userId
        ? "✅ Token validated by Clerk"
        : "❌ Token not validated. Check CLERK_SECRET_KEY in backend .env"
    }
  });
});
app.get("/api/analytics/report/:userId", (req, res) => {
  console.log("✅ REPORT API HIT");
  res.json({ ok: true });
});
// DB connection
export default app;
