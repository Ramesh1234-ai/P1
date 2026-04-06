import User from "../models/User.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
// REGISTER
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || "",
      lastName: lastName || "",
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};
// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ msg: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user });
  } catch (err) {
    res.status(500).json(err);
  }
};
// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    const user = await User.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching profile", error: err.message });
  }
};
// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const { firstName, lastName, bio, avatarUrl, username } = req.body;

    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (username !== undefined) updateData.username = username;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Error updating profile", error: err.message });
  }
};
// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const { notifications, settings } = req.body;

    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    const updateData = {};
    if (notifications) updateData.notifications = notifications;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "Settings updated successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Error updating settings", error: err.message });
  }
};

// UPDATE PASSWORD - Change password when logged in
export const updatePassword = async (req, res) => {
  try {
    // Support both Clerk (req.auth.userId) and old JWT (req.user.id)
    const userId = req.auth?.userId || req.user?.id || req.params.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: "User ID not provided",
        code: "USER_ID_MISSING"
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Current and new password required",
        code: "MISSING_PASSWORDS"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: "New password must be at least 8 characters",
        code: "PASSWORD_TOO_SHORT"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Reject if OAuth user (no password)
    if (!user.password) {
      return res.status(403).json({ 
        error: "Cannot change password for OAuth users. Use Clerk."
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD"
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error('❌ Password update error:', err);
    res.status(500).json({ error: "Error updating password", details: err.message });
  }
};

// FORGOT PASSWORD - Send reset email link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({ 
        error: "Email is required",
        code: "EMAIL_REQUIRED"
      });
    }

    console.log("📧 Forgot password request for:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    
    // Security: Always return success (prevent email enumeration)
    if (!user) {
      console.log(`⚠️ User not found for email: ${normalizedEmail}`);
      return res.json({ 
        message: "If an account exists with this email, a reset link will be sent",
        sent: true 
      });
    }

    console.log(`✅ User found:`, { userId: user._id, email: user.email });

    // Generate reset token (valid for 30 minutes)
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    console.log(`🔐 Generated token:`, { 
      tokenLength: resetToken.length,
      tokenPreview: resetToken.substring(0, 20) + "..."
    });

    // Save token to database using findByIdAndUpdate for reliability
    try {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            'security.resetToken': resetToken,
            'security.resetTokenExpiry': resetTokenExpiry
          }
        },
        { new: true }
      );

      console.log(`✅ Token saved successfully:`, {
        userId: updatedUser._id,
        hasToken: !!updatedUser.security?.resetToken,
        tokenPreview: updatedUser.security?.resetToken?.substring(0, 20),
        expiryTime: new Date(resetTokenExpiry).toISOString()
      });

      // VERIFICATION: Query again to confirm
      const verifyUser = await User.findById(updatedUser._id);
      console.log(`✅ Verification query - token in DB:`, {
        hasToken: !!verifyUser.security?.resetToken,
        tokenPreview: verifyUser.security?.resetToken?.substring(0, 20)
      });

      if (!verifyUser.security?.resetToken) {
        console.error(`❌ CRITICAL: Token not persisted to database!`);
        throw new Error('Token verification failed after save');
      }
    } catch (saveErr) {
      console.error(`❌ Failed to save token:`, saveErr.message);
      console.error(`   Full error:`, saveErr);
      return res.status(500).json({ 
        error: "Failed to generate reset token",
        details: saveErr.message 
      });
    }

    console.log(`✅ Password reset token generated for: ${normalizedEmail}`);
    console.log(`📧 [DEV MODE] Reset link would be: http://localhost:5173/reset-password?token=${resetToken}&email=${normalizedEmail}`);
    
    res.json({ 
      message: "If an account exists with this email, a reset link will be sent",
      sent: true,
      devToken: resetToken // Remove in production!
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ 
      error: "Error processing request",
      details: err.message 
    });
  }
};

// RESET PASSWORD - Using valid reset token from email
export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    console.log("📝 Reset password request received:", { 
      email: normalizedEmail,
      tokenLength: token?.length,
      passwordLength: newPassword?.length
    });

    if (!token || !normalizedEmail || !newPassword) {
      console.error("❌ Missing fields:", { 
        token: !!token, 
        email: !!normalizedEmail, 
        newPassword: !!newPassword 
      });
      return res.status(400).json({ 
        error: "Token, email, and new password required",
        code: "MISSING_FIELDS"
      });
    }

    if (newPassword.length < 8) {
      console.error("❌ Password too short:", newPassword.length);
      return res.status(400).json({ 
        error: "Password must be at least 8 characters",
        code: "PASSWORD_TOO_SHORT"
      });
    }

    // Find user by email
    console.log(`🔎 Finding user with email: ${normalizedEmail}`);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.error("❌ User not found:", normalizedEmail);
      return res.status(400).json({ 
        error: "Invalid reset link",
        code: "USER_NOT_FOUND"
      });
    }

    console.log(`✅ User found:`, { userId: user._id, email: user.email });

    // Verify reset token (compare hex strings directly)
    const storedToken = user.security?.resetToken;
    const tokenExpiry = user.security?.resetTokenExpiry;

    console.log("🔍 Token verification:", {
      tokenReceived: token.substring(0, 30) + "...",
      storedToken: storedToken ? storedToken.substring(0, 30) + "..." : "NONE",
      match: storedToken === token,
      tokenLength: { received: token?.length, stored: storedToken?.length },
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : "NONE",
      now: new Date().toISOString(),
      securityObject: user.security ? Object.keys(user.security) : "EMPTY"
    });

    if (!storedToken) {
      console.error("❌ No reset token found in database for:", normalizedEmail);
      console.error("   Security object keys:", user.security ? Object.keys(user.security) : "EMPTY");
      console.error("   Full user security:", user.security);
      return res.status(400).json({ 
        error: "Invalid or expired reset link - no token in database",
        code: "NO_TOKEN_IN_DB"
      });
    }

    if (storedToken !== token) {
      console.error("❌ Token mismatch:", {
        received: token,
        stored: storedToken,
        match: false
      });
      return res.status(400).json({ 
        error: "Invalid or expired reset link - token mismatch",
        code: "INVALID_TOKEN"
      });
    }

    // Check if token expired
    if (Date.now() > tokenExpiry) {
      console.error("❌ Token expired:", {
        now: new Date(Date.now()).toISOString(),
        expiry: new Date(tokenExpiry).toISOString(),
        expiredBy: Date.now() - tokenExpiry
      });
      // Clear expired token
      user.security.resetToken = null;
      user.security.resetTokenExpiry = null;
      await user.save();
      return res.status(400).json({ 
        error: "Reset link has expired. Please request a new one.",
        code: "TOKEN_EXPIRED"
      });
    }

    console.log("✅ Token is valid, proceeding with password reset...");
    
    // Hash new password and update using findByIdAndUpdate
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          'security.resetToken': null,
          'security.resetTokenExpiry': null,
          'security.lastLogin': new Date()
        }
      },
      { new: true }
    );
    
    console.log(`✅ Password reset successfully for: ${normalizedEmail}`);
    
    res.json({ 
      message: "Password reset successfully. You can now login with your new password.",
      success: true
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ 
      error: "Error resetting password",
      details: err.message 
    });
  }
};
// GET SECURITY INFO
export const getSecurityInfo = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;

    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    const user = await User.findById(userId).select(
      "security settings email -password"
    );

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json({
      email: user.email,
      security: user.security,
      settings: user.settings,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching security info", error: err.message });
  }
};

// GENERATE API KEY
export const generateAPIKey = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const { name } = req.body;

    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    if (!name)
      return res.status(400).json({ msg: "API key name required" });

    const apiKey = randomBytes(32).toString("hex");
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          apiKeys: {
            key: apiKey,
            name: name,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "API key generated", apiKey, user });
  } catch (err) {
    res.status(500).json({ msg: "Error generating API key", error: err.message });
  }
};

// DELETE API KEY
export const deleteAPIKey = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId;
    const { keyId } = req.body;

    if (!userId)
      return res.status(400).json({ msg: "User ID not provided" });

    if (!keyId)
      return res.status(400).json({ msg: "Key ID required" });

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          apiKeys: { _id: keyId },
        },
      },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json({ msg: "API key deleted", user });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting API key", error: err.message });
  }
};