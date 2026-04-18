import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_URL;
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
  timeout: 30000, // 30 seconds (increased from 20s to give API more time)
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
          console.log(
            `[apiClient] ✅ Token attached (${token.substring(0, 20)}...) to ${config.method?.toUpperCase()} ${config.url}`
          );
          // Log token length for debugging
          console.log(`[apiClient] Token length: ${token.length} chars`);
        } else {
          console.error(
            `[apiClient] ❌ getToken() returned null/empty for ${config.method?.toUpperCase()} ${config.url} — user may not be signed in to Clerk`
          );
        }
      } else {
        console.error(
          "[apiClient] ❌ CRITICAL: Clerk token provider NOT set. " +
            "Call setClerkTokenProvider(getToken) from ClerkTokenInit in main.jsx"
        );
      }
    } catch (err) {
      console.error("[apiClient] ❌ Failed to retrieve Clerk token:", err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// ─── Response interceptor — handle errors, timeouts, and diagnostics ────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.code;
    const message = error.message;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // ===== TIMEOUT ERROR =====
    if (code === "ECONNABORTED" || message?.includes("timeout")) {
      console.error(
        `[apiClient] ⏱️  TIMEOUT (30s exceeded) for ${method} ${url}`
      );
      console.error("[apiClient] Troubleshooting:");
      console.error("  1. Is backend server running? (npm run dev)");
      console.error("  2. Is MongoDB running? (mongod)");
      console.error("  3. Check backend console for errors");
      console.error("  4. Try accessing http://localhost:5000/api/auth/debug/setup");
      console.error("  5. Network tab → find request → see response");
      return Promise.reject({
        ...error,
        userMessage: "Request timed out. Backend may be slow or not responding. Check server logs."
      });
    }

    // ===== 401 UNAUTHORIZED =====
    if (status === 401) {
      if (!error.config._isRetry) {
        console.warn(
          "[apiClient] 🔐 401 Unauthorized — token invalid or expired"
        );
        console.error("[apiClient] Next steps:");
        console.error("  1. User may need to sign in again");
        console.error("  2. Check Clerk configuration");
        console.error("  3. Verify VITE_CLERK_PUBLISHABLE_KEY in .env.local");
        error.config._isRetry = true;
      }
    }

    // ===== 403 FORBIDDEN =====
    if (status === 403) {
      console.warn("[apiClient] 🚫 403 Forbidden — insufficient permissions.");
    }

    // ===== 503 SERVICE UNAVAILABLE =====
    if (status === 503) {
      console.error("[apiClient] 📡 503 Service Unavailable");
      console.error("   Backend error:", error.response?.data?.msg);
      console.error("[apiClient] Troubleshooting:");
      console.error("  1. Is MongoDB connected? Check backend console");
      console.error("  2. Restart backend: npm run dev");
    }

    // ===== 5XX SERVER ERROR =====
    if (status >= 500) {
      console.error(`[apiClient] 🔥 ${status} Server Error for ${method} ${url}`);
      console.error("   Backend error:", error.response?.data?.error);
      console.error("[apiClient] Check backend logs for details");
    }

    // ===== NETWORK ERROR (no response) =====
    if (!error.response) {
      console.error(`[apiClient] ❌ No response from server (network error)`);
      console.error(`   ${method} ${url}`);
      console.error("   Possible causes:");
      console.error("   1. Backend is not running");
      console.error("   2. Wrong API URL in .env (VITE_API_URL)");
      console.error("   3. CORS is blocking the request");
      console.error("   4. Network connectivity issue");
    }

    return Promise.reject(error);
  }
);
// ─── API helpers ──────────────────────────────────────────────────────────────
// Profile API
export const profileAPI = {
  getProfile: (userId) => apiClient.get(`/auth/profile`),
  updateProfile: (userId, data) => apiClient.put(`/auth/profile`, data),
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
