import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "../services/apiClient";
import { profileAPI, analyticsAPI } from "../services/apiClient";
import { useAsyncError } from "../components/common/asyncerrorhandler";

const AppContext = createContext();
export const AppProvider = ({ children }) => {
  const { getToken, isSignedIn, userId } = useAuth();
  const { reportError: reportAsyncError } = useAsyncError();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 🔑 NEW: Explicitly track if profile has been loaded (for ProtectedRoute)
  // isSignedIn = Clerk says user is logged in
  // isAuthenticated = We have fetched and cached the user profile
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Track if we've attempted to fetch (prevents double-fetch)
  const hasFetchedProfile = useRef(false);
  const hasFetchedAnalytics = useRef(false);

  // 🔑 Set Clerk token provider once
  useEffect(() => {
    if (getToken) {
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);

  // 🚀 Fetch Profile - WRAPPED IN useCallback
  // ✅ Auto-fetches on first authentication, handles both new and existing users
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📡 [auth_context] Fetching profile from /api/auth/profile...");
      const res = await profileAPI.getProfile();
      
      // Backend returns { success: true, user: {...} } or { success: true, msg: "...", user: {...} }
      const userData = res.data?.user || res.data;
      setUser(userData);
      setIsAuthenticated(true); // ✅ Profile loaded successfully
      console.log("✅ [auth_context] Profile fetched successfully — user is now AUTHENTICATED");
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || err.message || "Failed to fetch profile";
      console.error(`❌ [auth_context] Profile fetch failed (${status}):`, errorMsg);
      setError(errorMsg);
      setIsAuthenticated(false); // ❌ Profile fetch failed, not authenticated
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps = function never recreated

  // 📊 Fetch Analytics - WRAPPED IN useCallback
  // ✅ Only fetches after profile is available and userId is known
  const fetchAnalytics = useCallback(async () => {
    // Only fetch if userId is available from Clerk
    if (!userId) {
      console.warn("[auth_context] Skipping analytics - userId not available yet");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("📡 Fetching analytics for user:", userId);
      const res = await analyticsAPI.generateReport(userId);
      
      // Backend may return various formats, handle gracefully
      const analyticsData = res.data?.analytics || res.data?.data || res.data;
      setAnalytics(analyticsData);
      console.log("✅ Analytics fetched successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch analytics";
      console.error("❌ Analytics error:", errorMsg);
      setError(errorMsg);
      
      // Report error to async error handler
      if (reportAsyncError) {
        reportAsyncError({
          message: errorMsg,
          code: err.response?.status === 404 ? 'NO_ANALYTICS' : 'ANALYTICS_FETCH_ERROR',
          originalError: err,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId]); // ✅ Only userId as dependency

  // 🔄 Auto fetch when user logs in
  // Use refs to ensure we only fetch ONCE per authentication
  useEffect(() => {
    console.log(`[auth_context] useEffect triggered — isSignedIn=${isSignedIn}, userId=${userId}`);
    
    if (isSignedIn) {
      // Fetch profile only once
      if (!hasFetchedProfile.current) {
        hasFetchedProfile.current = true;
        console.log("🔄 [auth_context] User authenticated, queuing profile fetch...");
        fetchProfile();
      }
      
      // Fetch analytics only once (and only if userId is available)
      if (!hasFetchedAnalytics.current && userId) {
        hasFetchedAnalytics.current = true;
        console.log("🔄 [auth_context] User authenticated, queuing analytics fetch...");
        fetchAnalytics();
      }
    } else {
      // Reset refs when user signs out
      console.log("[auth_context] User signed out, resetting fetch guards and auth state...");
      hasFetchedProfile.current = false;
      hasFetchedAnalytics.current = false;
      setUser(null);
      setAnalytics(null);
      setError(null);
      setIsAuthenticated(false); // ✅ User signed out, no longer authenticated
    }
  }, [isSignedIn, userId, fetchProfile, fetchAnalytics]);

  return (
    <AppContext.Provider
      value={{
        // 🔑 Clerk state (primary auth source)
        isSignedIn,  // ✅ From Clerk useAuth()
        userId,      // ✅ From Clerk useAuth()
        // 📊 auth_context state (profile + analytics)
        user,
        analytics,
        error,
        // ⏳ Loading states
        loading,
        isAuthenticated,  // ✅ True only after profile fetch succeeds
        // 🔧 Methods
        fetchProfile,
        fetchAnalytics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
// Custom hook
export const useAppContext = () => useContext(AppContext);