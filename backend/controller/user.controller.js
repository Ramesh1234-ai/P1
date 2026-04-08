import  User from "../models/User.models.js"
export const getProfile = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const user = await User.findOne({ clerkId }).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching profile", error: err.message });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
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

    res.json({ msg: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ msg: "Error updating profile", error: err.message });
  }
};
export const updateSettings = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { notifications, settings } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        ...(notifications && { notifications }),
        ...(settings && { settings }),
      },
      { new: true }
    ).select("-password");

    res.json({ msg: "Settings updated", user });
  } catch (err) {
    res.status(500).json({ msg: "Error updating settings", error: err.message });
  }
};
export const generateAPIKey = async (req, res) => {
  try {
    const clerkId = req.auth.userId;
    const { name } = req.body;

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
    );
    res.json({ apiKey, user });
  } catch (err) {
    res.status(500).json(err);
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