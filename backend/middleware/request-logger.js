/**
 * Request Logger Middleware
 * 
 * Tracks:
 * - Request duration
 * - Slow requests (> 1 second)
 * - Hangs (no response within reasonable time)
 */

export const requestLogger = (req, res, next) => {
  // Skip logging for non-API endpoints
  if (!req.path.startsWith("/api")) {
    return next();
  }

  const startTime = Date.now();
  const originalJson = res.json;
  const originalSend = res.send;

  // Track when response is actually sent
  const logResponse = (method) => {
    return function (data) {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const durationMs = duration;
      // Warn if response took too long
      const isSlow = duration > 1000;
      const isVerySlow = duration > 5000;
      const logLevel = isVerySlow ? "🔴" : isSlow ? "🟡" : "✅";
      console.log(
        `${logLevel} [${status}] ${req.method.padEnd(6)} ${req.path.padEnd(30)} ${durationMs}ms`
      );
      if (isVerySlow) {
        console.error(
          `       ⚠️  SLOW RESPONSE! > 5 seconds — check database or processing logic`
        );
      }

      return method.apply(res, arguments);
    };
  };

  res.json = logResponse(originalJson);
  res.send = logResponse(originalSend);

  // Set a hard timeout to detect completely hung requests
  const timeoutId = setTimeout(() => {
    console.error(
      `❌ [TIMEOUT] ${req.method} ${req.path} — No response after 30 seconds!`
    );
    console.error("   Possible causes:");
    console.error("   1. MongoDB query is hanging");
    console.error("   2. External API call is blocked");
    console.error("   3. Infinite loop in controller");
    console.error("   4. Missing res.json() or res.send()");
  }, 30000);

  // Clear timeout when response is sent
  res.on("finish", () => {
    clearTimeout(timeoutId);
  });

  next();
};
/**
 * MongoDB Connection Status Check
 * Verifies DB is actually connected before processing queries
 */
export const checkDBConnection = (req, res, next) => {
  // Only check for protected API routes
  if (!req.path.includes("/auth/profile") && 
      !req.path.includes("/profile") &&
      !req.path.includes("/settings")) {
    return next();
  }
  // This will be set by your connectDB after successful connection
  if (!global.mongoConnected) {
    return res.status(503).json({
      success: false,
      msg: "Database not ready",
      error: "MongoDB connection still initializing. Please retry in a moment.",
      suggestion: "Check MongoDB logs: sudo systemctl status mongod"
    });
  }
  next();
};
