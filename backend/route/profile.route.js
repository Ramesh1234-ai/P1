import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  getAnalytics
} from "../controller/profile.controller.js";
import { requireAuth } from "@clerk/express";
const route = express.Router();
// ✅ All routes protected with Clerk JWT verification
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
