import { SignInButton, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
export default function ClerkPopup() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  
  // ✅ Use ref to ensure we only navigate ONCE, even if dependencies change
  // This prevents the "47+ navigations" infinite loop
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log(`[ClerkPopup] useEffect triggered — isSignedIn=${isSignedIn}, hasNavigated=${hasNavigated.current}`);
    
    // Guard 1: Only navigate if signed in
    // Guard 2: Only navigate once (never again after first time)
    if (isSignedIn && !hasNavigated.current) {
      hasNavigated.current = true;
      console.log("✅ [ClerkPopup] User signed in, navigating to /dashboard (ONE TIME)");
      navigate("/dashboard", { replace: true });
    }
    
    // Reset guard when user signs out
    if (!isSignedIn) {
      console.log("[ClerkPopup] User signed out, resetting navigation guard");
      hasNavigated.current = false;
    }
  }, [isSignedIn, navigate]); // Keep dependencies but guard prevents re-execution

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