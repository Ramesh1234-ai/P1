import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      default:""
    },
    username: {
      type: String,
      required: true,
      unique:true,
      default:" ",
    },
    password: {
      type: String,
      required: true,
      default:" ",
    },
    firstName: {
      type: String,
      default: "",
      required:true
    },
    lastName: {
      type: String,
      default: "",
      required:true
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      required:true
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
      dataCollection: {
        type: Boolean,
        default: true,
      },
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "en",
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
    },
    security: {
      lastLogin: {
        type: Date,
        default: null,
      },
      loginAttempts: {
        type: Number,
        default: 0,
      },
      lockUntil: {
        type: Date,
        default: null,
      },
      resetToken: {
        type: String,
        default: null,
      },
      resetTokenExpiry: {
        type: Date,
        default: null,
      },
    },
    apiKeys: [
      {
        key: String,
        name: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: Date,
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;