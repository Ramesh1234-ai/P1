import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  getAnalytics
} from "../controller/profile.controller.js";
import { verifyClerkToken, requireAuth } from "../middleware/clerk-token.middleware.js";

const route = express.Router();

// All routes protected with Clerk JWT verification
route.use(verifyClerkToken);
route.use(requireAuth);

// Profile routes
route.get("/profile/:userId", getUserProfile);
route.put("/profile/:userId", updateUserProfile);

// Settings routes
route.get("/settings/:userId", getUserSettings);
route.put("/settings/:userId", updateUserSettings);

// Analytics route
route.get("/analytics/:userId", getAnalytics);

export default route;
