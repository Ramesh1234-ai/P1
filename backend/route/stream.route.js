import express from "express";
import {
  createStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamMetrics,
  getStreamViewers,
  getCreatorStreams,
  getStreamRecordings,
  getStreamStatus,
  getRecordingStatusEndpoint,
  getAllActiveRecordings,
} from "../controller/stream.controller.js";
import { verifyClerkToken } from "../middleware/clerk-token.middleware.js";
const router = express.Router();
// 🔧 Stream Management
router.post("/create", verifyClerkToken, createStream); // Create stream and get stream key
router.put("/end/:id", verifyClerkToken, endStream); // End stream
router.get("/live", getLiveStreams); // Get all live streams
router.get("/:id", getStreamById); // Get stream details
// 📊 Stream Metrics & Analytics
router.get("/:streamId/metrics", getStreamMetrics); // Get stream metrics (bitrate, fps, health, etc.)
router.get("/:streamId/viewers", getStreamViewers); // Get list of current viewers
router.get("/:streamId/status", getStreamStatus); // Get detailed stream status
// 🎥 Recording Status
router.get("/:streamId/recording", getRecordingStatusEndpoint); // Get recording status for specific stream
router.get("/recording/active/all", getAllActiveRecordings); // Get all active recordings
// 👤 Creator's Streams
router.get("/creator/:creatorId/all", getCreatorStreams); // Get all streams by creator
router.get("/creator/:creatorId/recordings", getStreamRecordings); // Get VOD recordings
export default router;