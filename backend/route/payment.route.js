import express from "express";
import {
  createPayment,
  getPaymentHistory,
  verifyPayment,
  updatePaymentStatus,
  getPaymentStats,
  deletePayment,
} from "../controller/payment.controller.js";
import { verifyClerkToken } from "../middleware/clerk-token.middleware.js";
const router = express.Router();
/**
 * Payment API Routes
 * Base URL: /api/payment
 */
// ==================== PUBLIC ROUTES ====================
// Verify payment (public - just needs transaction ID)
router.get("/verify/:transactionId", verifyPayment);
// ==================== PROTECTED ROUTES (Clerk Auth) ====================
// Create payment
router.post("/create", verifyClerkToken, createPayment);
// Get payment history for user
router.get("/history/:userId", verifyClerkToken, getPaymentHistory);
// Get payment statistics
router.get("/stats/:userId", verifyClerkToken, getPaymentStats);
// Update payment status
router.put("/status/:transactionId", verifyClerkToken, updatePaymentStatus);
// Delete payment record
router.delete("/:transactionId", verifyClerkToken, deletePayment);

export default router;