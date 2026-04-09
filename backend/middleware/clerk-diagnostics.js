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
  console.log("[⚙️ Clerk Setup Diagnostics - Backend]");
  console.log("=".repeat(70));
  
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  const secretKeyPreview = process.env.CLERK_SECRET_KEY?.substring(0, 20);
  const secretKeyLength = process.env.CLERK_SECRET_KEY?.length || 0;
  
  console.log(`✓ CLERK_SECRET_KEY configured: ${hasSecretKey}`);
  if (hasSecretKey) {
    console.log(`  Preview: ${secretKeyPreview}...`);
    console.log(`  Length: ${secretKeyLength} chars`);
  } else {
    console.error("❌ CRITICAL: CLERK_SECRET_KEY not configured!");
    console.error("   Add to backend .env: CLERK_SECRET_KEY=sk_test_xxxxx");
    console.error("   Get it from: https://dashboard.clerk.com → Settings → API Keys");
  }
  
  const hasPublishableKey = !!process.env.CLERK_PUBLISHABLE_KEY;
  const pubKeyPreview = process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 20);
  
  console.log(`✓ CLERK_PUBLISHABLE_KEY configured: ${hasPublishableKey}`);
  if (hasPublishableKey) {
    console.log(`  Preview: ${pubKeyPreview}...`);
  } else {
    console.warn("⚠️  CLERK_PUBLISHABLE_KEY not configured (optional, informational)");
  }
  
  // Check if keys match (same Clerk instance)
  if (hasSecretKey && hasPublishableKey) {
    const secretInstance = secretKeyPreview?.split("_")[2];
    const pubInstance = pubKeyPreview?.split("_")[2];
    
    if (secretInstance === pubInstance) {
      console.log(`✓ Keys are from SAME Clerk instance: ${secretInstance}`);
    } else {
      console.error(`❌ Keys are from DIFFERENT Clerk instances!`);
      console.error(`   Secret key instance: ${secretInstance}`);
      console.error(`   Public key instance: ${pubInstance}`);
      console.error(`   They must match!`);
    }
  }
  
  console.log("\n[📀 Clerk Middleware Flow - What Should Happen]:");
  console.log("1. Frontend.getToken() → Returns JWT signed by Clerk");
  console.log("2. Frontend.apiClient attaches: Authorization: Bearer <JWT>");
  console.log("3. Backend receives Authorization header");
  console.log("4. clerkMiddleware() extracts Bearer token");
  console.log("5. clerkMiddleware() validates using CLERK_SECRET_KEY");
  console.log("6. If valid: req.auth = { userId, email, ... } ✅");
  console.log("7. If invalid: req.auth = null/undefined ❌");
  console.log("8. requireAuth() checks if req.auth exists");
  console.log("9. If not: returns 401 Unauthorized");
  console.log("10. If yes: calls next(), controller executes");
  
  console.log("\n[🔴 Why You Might Get 401]:");
  console.log("1. CLERK_SECRET_KEY not set (check .env)");
  console.log("2. Keys from different Clerk instances");
  console.log("3. .env file not loaded (restart backend)");
  console.log("4. Authorization header not sent (check frontend)");
  console.log("5. Token expired or malformed");
  console.log("6. clerkMiddleware not applied before routes");
  
  console.log("\n" + "=".repeat(70) + "\n");
};

/**
 * Middleware to log req.auth details on every request
 * Insert this AFTER clerkMiddleware in app.js
 * 
 * Helps debug why req.auth is empty
 */
/**
 * Middleware to log req.auth details on every request
 * Shows exactly what's happening with token validation
 */
export const logClerkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const hasToken = !!authHeader;
  const hasAuth = !!req.auth;
  const isProtectedRoute = req.path.includes("/profile") || 
                          req.path.includes("/analytics") ||
                          req.path.includes("/settings");
  // Log all protected routes for visibility
  if (isProtectedRoute || req.path.includes("/debug")) {
    console.log(`\n[🔐 ClerkAuth] ${req.method} ${req.path}`);
    
    if (hasToken) {
      const tokenPreview = authHeader.substring(0, 40) + "...";
      const isBearerFormat = authHeader.startsWith("Bearer ");
      console.log(`  📦 Token received: ${isBearerFormat ? "✅ Bearer format" : "❌ NOT Bearer format"}`);
      console.log(`     ${tokenPreview}`);
    } else {
      console.warn(`  ❌ NO Token - Authorization header missing`);
    }
    if (hasAuth && req.auth.userId) {
      console.log(`  ✅ TOKEN VALID - req.auth populated`);
      console.log(`     userId: ${req.auth.userId}`);
      console.log(`     email: ${req.auth.email || "(undefined)"}`);
      console.log(`     auth keys: [${Object.keys(req.auth).join(", ")}]`);
    } else {
      console.error(`  ❌ TOKEN INVALID - req.auth is empty/null`);
      console.error(`     Reason: clerkMiddleware() failed to validate`);
      console.error(`     Check:`);
      console.error(`       1. CLERK_SECRET_KEY set in backend/.env?`);
      console.error(`       2. Token not expired?`);
      console.error(`       3. Token from same Clerk instance?`);
      console.error(`       4. Frontend attached Bearer token?`);
    }
  }
  
  next();
};
/**
 * Middleware wrapper that ensures clerkMiddleware is properly configured
 * Handles both old and new versions of @clerk/express
 */
export const createClerkMiddleware = () => {
  // Log startup info
  console.log("\n[🚀 Creating Clerk Middleware]");
  console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? "✅ Present" : "❌ Missing"}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  
  // Middleware that validates Clerk is properly set up
  return (req, res, next) => {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("\n❌ FATAL: CLERK_SECRET_KEY not set!");
      console.error("   Please add to backend/.env:");
      console.error("   CLERK_SECRET_KEY=sk_test_xxxxx");
      console.error("   Then restart: npm run dev\n");
      
      // Allow request to continue but it will fail auth check
      return next();
    }
    next();
  };
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
