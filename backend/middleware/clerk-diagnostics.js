/**
 * Backend Clerk Setup Verification
 * 
 * This file helps diagnose Clerk middleware issues by:
 * 1. Verifying CLERK_SECRET_KEY is set
 * 2. Logging token validation at each step
 * 3. Showing exactly what req.auth contains after clerkMiddleware
 */

export const clerkSetupDiagnostics = () => {
  console.log("\n" + "=".repeat(70));
  console.log("[Clerk Setup Diagnostics]");
  console.log("=".repeat(70));
  
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  const secretKeyPreview = process.env.CLERK_SECRET_KEY?.substring(0, 20);
  
  console.log(`✓ CLERK_SECRET_KEY configured: ${hasSecretKey}`);
  if (hasSecretKey) {
    console.log(`  Preview: ${secretKeyPreview}...`);
  }
  
  const hasPublishableKey = !!process.env.CLERK_PUBLISHABLE_KEY;
  console.log(`✓ CLERK_PUBLISHABLE_KEY configured: ${hasPublishableKey}`);
  
  if (!hasSecretKey) {
    console.error("❌ CRITICAL: CLERK_SECRET_KEY not configured!");
    console.error("   Add to backend .env: CLERK_SECRET_KEY=sk_test_xxxxx");
  }
  
  if (!hasPublishableKey) {
    console.warn("⚠️  CLERK_PUBLISHABLE_KEY not configured in backend (optional, but helpful)");
  }
  
  console.log("\n[Clerk Middleware Flow]:");
  console.log("1. Frontend sends: Authorization: Bearer <JWT token>");
  console.log("2. clerkMiddleware extracts token from header");
  console.log("3. clerkMiddleware validates token using CLERK_SECRET_KEY");
  console.log("4. If valid: req.auth = { userId, email, ... }");
  console.log("5. If invalid: req.auth = null (undefined in older @clerk/express)");
  
  console.log("\n" + "=".repeat(70) + "\n");
};

/**
 * Middleware to log req.auth details on every request
 * Insert this AFTER clerkMiddleware in app.js
 */
export const logClerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const hasToken = !!authHeader;
  const hasAuth = !!req.auth;
  
  // Only log for API endpoints, not for static files
  if (!req.path.startsWith("/api")) {
    return next();
  }
  console.log("\n[ClerkAuth Request] " + req.method + " " + req.path);  
  if (hasToken) {
    const tokenStart = authHeader.substring(0, 50);
    console.log(`  Token sent: ${tokenStart}...`);
  } else {
    console.warn("  ⚠️  No Authorization header");
  }
  
  if (hasAuth) {
    console.log(`  ✅ Clerk validated:
    - userId: ${req.auth.userId}
    - email: ${req.auth.email || "(not included in token)"}`);
  } else {
    console.warn("  ❌ req.auth is NULL/undefined");
    console.warn("     Clerk middleware could not validate the token");
  }
  
  next();
};

/**
 * Enhanced error response for 401 errors
 * Shows user what went wrong with Clerk auth
 */
export const clerkauthErrorHandler = (err, req, res, next) => {
  // Only handle auth errors
  if (err.message?.includes("Unauthorized") || err.status === 401) {
    console.error("[Clerk Auth Error] Unauthorized request to " + req.path);
    
    return res.status(401).json({
      success: false,
      msg: "Not authenticated with Clerk",
      debug: {
        path: req.path,
        hasAuthHeader: !!req.headers.authorization,
        reqAuthExists: !!req.auth,
        clerkUserId: req.auth?.userId || null,
        suggestions: [
          "1. Verify frontend is calling setClerkTokenProvider(getToken)",
          "2. Check useAuth() returns valid userId (not undefined)",
          "3. Verify VITE_CLERK_PUBLISHABLE_KEY is set in frontend .env.local",
          "4. Verify CLERK_SECRET_KEY is set in backend .env (and matches frontend)",
          "5. Check Network tab to confirm Authorization header is sent",
          "6. Verify getToken() is not returning null"
        ]
      }
    });
  }  
  next(err);
};
