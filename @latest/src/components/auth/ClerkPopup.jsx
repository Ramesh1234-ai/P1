import { SignInButton, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function ClerkPopup() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  // ✅ Use useEffect to navigate INSTEAD of returning <Navigate> from render
  // This prevents infinite loops from navigation during render
  useEffect(() => {
    if (isSignedIn) {
      console.log("✅ User signed in, navigating to dashboard");
      // Use replace=true to prevent back button from returning to login
      navigate("/dashboard", { replace: true });
    }
  }, [isSignedIn, navigate]);

  // ✅ Only render signin button while not authenticated
  if (isSignedIn) {
    return null; // Return null while navigating, don't render anything
  }

  return (
    <SignInButton mode="modal">
      <button>Continue with Google / Github</button>
    </SignInButton>
  );
}