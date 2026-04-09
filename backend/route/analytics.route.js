import express from "express";
import {
  createAnalytics,
  getStreamAnalytics,
  getUserAnalytics,
  getAnalyticsByDateRange,
  generateAnalyticsReport,
  updateEngagementMetrics,
} from "../controller/analytics.controller.js";
import { requireAuth } from "@clerk/express";
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
router.post("/create", requireAuth, createAnalytics);
// Get user analytics (all streams)
router.get("/user/:userId", requireAuth, getUserAnalytics);
// Get analytics by date range
router.get("/range", requireAuth, getAnalyticsByDateRange);
// Generate comprehensive report
router.get("/report/:userId", requireAuth, generateAnalyticsReport);
// Update engagement metrics
router.put("/engagement/:streamId", requireAuth, updateEngagementMetrics);
export default router;
