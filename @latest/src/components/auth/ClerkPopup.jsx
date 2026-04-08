import { SignInButton, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

// 🔑 Module-level variable to persist across component remounts
// This ensures navigation happens EXACTLY ONCE even if component unmounts/remounts
let hasNavigatedGlobally = false;

export default function ClerkPopup() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(
      `[ClerkPopup] useEffect triggered — isSignedIn=${isSignedIn}, hasNavigatedGlobally=${hasNavigatedGlobally}`
    );

    // Guard: Only navigate ONCE, globally, when user signs in
    if (isSignedIn && !hasNavigatedGlobally) {
      hasNavigatedGlobally = true;
      console.log("✅ [ClerkPopup] User signed in, navigating to /dashboard (TRULY ONCE)");
      navigate("/dashboard", { replace: true });
    }

    // Reset flag when user signs out
    if (!isSignedIn) {
      console.log("[ClerkPopup] User signed out, allowing re-navigation");
      hasNavigatedGlobally = false;
    }
  }, [isSignedIn, navigate]);

  // ✅ Only render signin button while not signed in
  if (isSignedIn) {
    return null; // Don't render anything; let ProtectedRoute handle the view
  }

  return (
    <SignInButton mode="modal">
      <button>Continue with Google / Github</button>
    </SignInButton>
  );
}