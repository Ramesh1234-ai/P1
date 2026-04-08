import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import  {AppProvider}  from "../src/context/auth_context";
import { AsyncErrorProvider } from "./components/common/asyncerrorhandler";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/react";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AsyncErrorProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AsyncErrorProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);