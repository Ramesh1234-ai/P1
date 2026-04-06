import express from "express";
import { generateChatResponse } from "../controller/gemini.controller.js";
import { VerifyJwt } from "../middleware/auth.middleware.js";
const router = express.Router();
// POST /api/gemini/chat
router.post("/chat", generateChatResponse);
router.post("/chat:id/get",VerifyJwt,getChat);
router.post("/chat:id/rec",VerifyJwt,receiveChat);
router.get("/chat:id/History",VerifyJwt,getChatHistory)
export default router;
