import express from "express";
import { handleAsyncError } from "@/utils";
import { authenticate } from "@/middleware";
import { streamingChatCompletion } from "@/controllers/ai.controller";

const router = express.Router();

/**
 * @route   POST /api/ai/chat/stream
 * @desc    Streaming chat completion using Server-Sent Events
 * @access  Protected
 */
router.post(
  "/chat/stream",
  authenticate,
  handleAsyncError(streamingChatCompletion)
);

export default router;
