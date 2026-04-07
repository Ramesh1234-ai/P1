import axios from "axios";
import { getFollow } from "../../../backend/controller/follow.controller";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Token Provider ───────────────────────────────────────────────────────────
// Clerk tokens cannot be stored in localStorage — they are short-lived JWTs
// that must be fetched fresh from Clerk on each request.
//
// Call `setClerkTokenProvider(getToken)` once inside your app (e.g., in a
// top-level component or context) where `getToken` is the function returned
// by Clerk's `useAuth()` hook.
//
//   import { useAuth } from "@clerk/clerk-react";
//   const { getToken } = useAuth();
//   setClerkTokenProvider(getToken);

let _getClerkToken = null;

export const setClerkTokenProvider = (fn) => {
  _getClerkToken = fn;
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});
// ─── Request interceptor — attach Clerk token ─────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (typeof _getClerkToken === "function") {
        // getToken() fetches a fresh, signed Clerk JWT each time
        const token = await _getClerkToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        console.warn(
          "[apiClient] Clerk token provider not set. " +
            "Call setClerkTokenProvider(getToken) from useAuth()."
        );
      }
    } catch (err) {
      console.error("[apiClient] Failed to retrieve Clerk token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// ─── Response interceptor — handle errors, prevent infinite 401 loops ─────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Mark the request so we never retry a 401 response automatically.
      // The actual sign-out / redirect should be handled at the UI layer
      // (e.g., via a <SignedIn> / <SignedOut> wrapper in Clerk).
      if (!error.config._isRetry) {
        console.warn(
          "[apiClient] 401 Unauthorized — token invalid or expired. " +
            "The user may need to sign in again."
        );
        error.config._isRetry = true; // guard flag — do NOT resend
      }
    }

    if (status === 403) {
      console.warn("[apiClient] 403 Forbidden — insufficient permissions.");
    }

    return Promise.reject(error);
  }
);

// ─── API helpers ──────────────────────────────────────────────────────────────

// Profile API
export const profileAPI = {
  getProfile: (userId) => apiClient.get(`/profile/${userId}`),
  updateProfile: (userId, data) => apiClient.put(`/profile/${userId}`, data),
};

// Settings API
export const settingsAPI = {
  getSettings: (userId) => apiClient.get(`/settings/${userId}`),
  updateSettings: (userId, data) => apiClient.put(`/settings/${userId}`, data),
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: (userId, range = "7days") =>
  apiClient.get(`/analytics/user/${userId}`, {
    params: { range }
  }),
  getStreamAnalytics: (streamId) =>
    apiClient.get(`/analytics/stream/${streamId}`),
  getUserAnalytics: (userId) => apiClient.get(`/analytics/user/${userId}`),
  getAnalyticsByDateRange: (userId, startDate, endDate) =>
    apiClient.get(`/analytics/range`, { params: { userId, startDate, endDate } }),
  generateReport: (userId) => apiClient.get(`/analytics/report/${userId}`),
  updateEngagementMetrics: (streamId, data) =>
    apiClient.put(`/analytics/engagement/${streamId}`, data),
};

// Payment API
export const paymentAPI = {
  createPayment: (data) => apiClient.post(`/payment/create`, data),
  getPaymentHistory: (userId) => apiClient.get(`/payment/history/${userId}`),
  verifyPayment: (transactionId) =>
    apiClient.get(`/payment/verify/${transactionId}`),
  getPaymentStats: (userId) => apiClient.get(`/payment/stats/${userId}`),
  updatePaymentStatus: (transactionId, status) =>
    apiClient.put(`/payment/status/${transactionId}`, {
      paymentStatus: status,
    }),
  deletePayment: (transactionId) =>
    apiClient.delete(`/payment/${transactionId}`),
};
// User API
export const userAPI = {
  getUserProfile: (userId) => apiClient.get(`/user/profile/${userId}`),
  getUserSettings: (userId) => apiClient.get(`/user/settings/${userId}`),
};
export const Follow ={
  getFollow:(userId)=> apiClient.get(`/follower/follow/${userId}`),
  getfollwoing:(userId) => apiClient.get(`/follower/following/${userId}`),
  getUnfollow:(userId) =>apiClient.get(`/follower//Unfollow/${userId}`),
  getfollwers:(userId) =>apiClient.get(`/follower/user/${userId}/followers`)
};
export default apiClient;
