import User from "../models/User.models.js";
import { randomBytes } from "crypto";
/**
 * GET /api/auth/profile
 * ✅ Fetch user profile - Auto-create if doesn't exist
 * 
 * This is called by frontend after Clerk auth
 * Handles both:
 * 1. User exists → return profile
 * 2. User doesn't exist → auto-create with Clerk data
 */
export const getProfile = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    
    if (!clerkId) {
      return res.status(401).json({ 
        success: false,
        msg: "Not authenticated - Clerk ID missing" 
      });
    }

    // 1️⃣ Try to find existing user
    let user = await User.findOne({ clerkId }).select("-password");
    
    if (user) {
      // User exists, return profile
      return res.json({ 
        success: true,
        msg: "Profile fetched",
        user 
      });
    }

    // 2️⃣ User doesn't exist → Auto-create with minimal data
    console.log(`📝 Auto-creating user for Clerk ID: ${clerkId}`);
    
    // Get email and name from Clerk user data (if available)
    const email = req.auth?.email || `user-${clerkId}@clerk.local`;
    const firstName = req.auth?.first_name || "User";
    const lastName = req.auth?.last_name || clerkId.slice(-6);
    
    user = new User({
      clerkId,
      email,
      firstName,
      lastName,
      username: `${firstName.toLowerCase()}-${clerkId.slice(-4)}`,
      password: "clerk-auth", // Dummy password - Clerk handles actual auth
      // All other fields use defaults from schema
    });

    await user.save();
    console.log(`✅ User auto-created for ${clerkId}`);

    res.status(201).json({ 
      success: true,
      msg: "User profile created",
      user: user
    });

  } catch (err) {
    console.error("❌ Error in getProfile:", err.message);
    
    // Handle duplicate clerkId (race condition)
    if (err.code === 11000 && err.keyPattern?.clerkId) {
      console.log("⚠️ Race condition: User already created, fetching...");
      try {
        const user = await User.findOne({ clerkId: req.auth.userId }).select("-password");
        return res.json({ 
          success: true,
          msg: "Profile fetched (duplicate)",
          user 
        });
      } catch (innerErr) {
        console.error("❌ Failed to recover from race condition:", innerErr);
      }
    }
    
    res.status(500).json({ 
      success: false,
      msg: "Error fetching profile", 
      error: err.message 
    });
  }
};
/**
 * PUT /api/auth/profile
 * ✅ Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    
    if (!clerkId) {
      return res.status(401).json({ 
        success: false,
        msg: "Not authenticated" 
      });
    }

    const { firstName, lastName, bio, avatarUrl, username } = req.body;

    const updateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(bio && { bio }),
      ...(avatarUrl && { avatarUrl }),
      ...(username && { username }),
    };

    const user = await User.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    res.json({ 
      success: true,
      msg: "Profile updated", 
      user 
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err.message);
    res.status(500).json({ 
      success: false,
      msg: "Error updating profile", 
      error: err.message 
    });
  }
};
/**
 * PUT /api/auth/settings
 * ✅ Update user settings (notifications, preferences)
 */
export const updateSettings = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    
    if (!clerkId) {
      return res.status(401).json({ 
        success: false,
        msg: "Not authenticated" 
      });
    }

    const { notifications, settings } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        ...(notifications && { notifications }),
        ...(settings && { settings }),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    res.json({ 
      success: true,
      msg: "Settings updated", 
      user 
    });
  } catch (err) {
    console.error("❌ Error updating settings:", err.message);
    res.status(500).json({ 
      success: false,
      msg: "Error updating settings", 
      error: err.message 
    });
  }
};
/**
 * POST /api/auth/apikey
 * ✅ Generate new API key for user
 */
export const generateAPIKey = async (req, res) => {
  try {
    const clerkId = req.auth?.userId;
    const { name } = req.body;

    if (!clerkId) {
      return res.status(401).json({ 
        success: false,
        msg: "Not authenticated" 
      });
    }

    if (!name) {
      return res.status(400).json({ 
        success: false,
        msg: "API key name is required" 
      });
    }

    const apiKey = randomBytes(32).toString("hex");
    
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $push: {
          apiKeys: {
            key: apiKey,
            name,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    res.status(201).json({ 
      success: true,
      msg: "API key generated",
      apiKey, 
      user 
    });
  } catch (err) {
    console.error("❌ Error generating API key:", err.message);
    res.status(500).json({ 
      success: false,
      msg: "Error generating API key",
      error: err.message 
    });
  }
};
export const syncUser = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const email = req.auth.sessionClaims?.email;

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({
        clerkId,
        email,
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};