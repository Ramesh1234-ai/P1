import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import  {AppProvider}  from "../src/context/auth_context";
import { AsyncErrorProvider } from "./components/common/asyncerrorhandler";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/react";

// ✅ NEW: Clerk Token Setup (BEFORE rendering AppProvider)
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "./services/apiClient";

function ClerkTokenInit({ children }) {
  const { getToken } = useAuth();
  
  // Set token provider once, at the earliest possible moment
  React.useEffect(() => {
    if (getToken) {
      console.log("[ClerkTokenInit] Setting Clerk token provider");
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);
  
  return children;
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AsyncErrorProvider>
        <ClerkTokenInit>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppProvider>
              <App />
            </AppProvider>
          </BrowserRouter>
        </ClerkTokenInit>
      </AsyncErrorProvider>
    </ClerkProvider>
  </React.StrictMode>
);