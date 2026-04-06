import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "../services/apiClient";
import { profileAPI, analyticsAPI } from "../services/apiClient";
const AppContext = createContext();
export const AppProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
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

  // 🚀 Fetch Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      console.error("Profile error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.generateReport();
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Auto fetch when user logs in
  useEffect(() => {
    if (isSignedIn) {
      fetchProfile();
      fetchAnalytics();
    } else {
      setUser(null);
      setAnalytics(null);
    }
  }, [isSignedIn]);

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