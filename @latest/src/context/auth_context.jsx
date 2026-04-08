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
  // 🔑 Set Clerk token provider once
  useEffect(() => {
    if (getToken) {
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);

  // 🚀 Fetch Profile - WRAPPED IN useCallback TO PREVENT RECREATION
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await profileAPI.getProfile();
      setUser(res.data);
      console.log("✅ Profile fetched successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch profile";
      console.error("❌ Profile error:", errorMsg);
      setError(errorMsg);
      reportAsyncError({
        message: errorMsg,
        code: err.response?.status === 404 ? 'PROFILE_NOT_FOUND' : 'PROFILE_FETCH_ERROR',
        originalError: err,
      });
    } finally {
      setLoading(false);
    }
  }, [reportAsyncError]);

  // 📊 Fetch Analytics - WRAPPED IN useCallback + PASS userId
  const fetchAnalytics = useCallback(async () => {
    // Only fetch if userId is available from Clerk
    if (!userId) {
      console.warn("[auth_context] Skipping analytics fetch - userId not available yet");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Pass userId to generateReport - backend extracts from Clerk auth context
      const res = await analyticsAPI.generateReport(userId);
      setAnalytics(res.data);
      console.log("✅ Analytics fetched successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch analytics";
      console.error("❌ Analytics error:", errorMsg);
      setError(errorMsg);
      reportAsyncError({
        message: errorMsg,
        code: err.response?.status === 404 ? 'NO_ANALYTICS' : 'ANALYTICS_FETCH_ERROR',
        originalError: err,
      });
    } finally {
      setLoading(false);
    }
  }, [userId, reportAsyncError]);

  // 🔄 Auto fetch when user logs in - ONLY DEPENDS ON isSignedIn
  // Use a ref to track if we've already fetched to prevent double fetches
  const hasFetched = React.useRef(false);
  
  useEffect(() => {
    if (isSignedIn && !hasFetched.current) {
      hasFetched.current = true;
      console.log("🔄 User authenticated, fetching profile and analytics...");
      fetchProfile();
      fetchAnalytics();
    } else if (!isSignedIn) {
      hasFetched.current = false;
      setUser(null);
      setAnalytics(null);
      setError(null);
    }
  }, [isSignedIn, fetchProfile, fetchAnalytics]);

  return (
    <AppContext.Provider
      value={{
        user,
        analytics,
        loading,
        error,
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