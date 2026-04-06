import express from "express";
import { requireAuth } from "@clerk/express";
import {
  login,
  register,
  getProfile,
  updateProfile,
  updateSettings,
  updatePassword,
  forgotPassword,
  resetPassword,
  getSecurityInfo,
  generateAPIKey,
  deleteAPIKey,
} from "../controller/user.controller.js";

const route = express.Router();
// ==================== PUBLIC ROUTES ====================
// Legacy auth (for backward compatibility)
route.post("/register", register);
route.post("/login", login);
// Password reset flows (public)
route.post("/forgot-password", forgotPassword);
route.post("/reset-password", resetPassword);
// ==================== PROTECTED ROUTES (Clerk) ====================
// Use requireAuth() from @clerk/express for new Clerk-based auth
route.get("/profile/:userId", requireAuth(), getProfile);
route.put("/profile/:userId", requireAuth(), updateProfile);
route.put("/settings/:userId", requireAuth(), updateSettings);
// ⭐ PASSWORD CHANGE (requires current password)
route.put("/password/:userId", requireAuth(), updatePassword);
// Security & API keys
route.get("/security/:userId", requireAuth(), getSecurityInfo);
route.post("/apikey/:userId", requireAuth(), generateAPIKey);
route.delete("/apikey/:userId", requireAuth(), deleteAPIKey);
// ==================== LEGACY ROUTES (Old JWT) ====================
// Kept for migration period - will be deprecated
route.get("/profile-legacy/:userId", requireAuth, getProfile);
route.put("/profile-legacy/:userId", requireAuth, updateProfile);
route.put("/password-legacy/:userId",requireAuth, updatePassword);
export default route;