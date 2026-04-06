import { SignInButton, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";
export default function ClerkPopup() {
  const { isSignedIn } = useUser();
  if (isSignedIn) {
    return <Navigate to="/dashboard" />;
  }
  return (
    <SignInButton mode="modal">
      <button>Continue with Google / Github</button>
    </SignInButton>
  );
}