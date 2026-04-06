import express from "express";
import {
  createAnalytics,
  getStreamAnalytics,
  getUserAnalytics,
  getAnalyticsByDateRange,
  generateAnalyticsReport,
  updateEngagementMetrics,
} from "../controller/analytics.controller.js";
import { verifyClerkToken } from "../middleware/clerk-token.middleware.js";
const router = express.Router();
/**
 * Analytics API Routes
 * Base URL: /api/analytics
 */
// ==================== PUBLIC ROUTES ====================
// Get stream analytics (public view)
router.get("/stream/:streamId", getStreamAnalytics);
// ==================== PROTECTED ROUTES (Clerk Auth) ====================
// Create or update analytics
router.post("/create", verifyClerkToken, createAnalytics);
// Get user analytics (all streams)
router.get("/user/:userId", verifyClerkToken, getUserAnalytics);
// Get analytics by date range
router.get("/range", verifyClerkToken, getAnalyticsByDateRange);
// Generate comprehensive report
router.get("/report/:userId", verifyClerkToken, generateAnalyticsReport);
// Update engagement metrics
router.put("/engagement/:streamId", verifyClerkToken, updateEngagementMetrics);
export default router;
