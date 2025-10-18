import { Request, Response } from "express";
import httpStatus from "http-status";
import { generateStreamingChatCompletion } from "../services";
import { logger, ApiError } from "../utils";
import { config } from "../config";
import {
  StreamingChatRequest,
  ChatMessage,
  StreamingChunk,
} from "../types/ai.types";

/**
 * Streaming chat completion endpoint
 *
 * @route POST /api/ai/chat/stream
 * @access Protected (requires authentication)
 * @description Stream chat response in real-time using Server-Sent Events
 */
export const streamingChatCompletion = async (
  req: Request<{}, {}, StreamingChatRequest>,
  res: Response
) => {
  try {
    console.log("streamingChatCompletion");
    const userId = (req.user as any)?.id ?? "unknown";

    const {
      message,
      systemPrompt,
      conversationHistory = [],
      model,
      temperature,
      maxTokens,
    } = req.body;

    // Validation
    if (!message || message.trim().length === 0) {
      throw new ApiError("Message is required", httpStatus.BAD_REQUEST);
    }

    if (message.length > 10000) {
      throw new ApiError(
        "Message is too long (max 10000 characters)",
        httpStatus.BAD_REQUEST
      );
    }

    // Build messages array
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    if (conversationHistory.length > 0) {
      const limitedHistory = conversationHistory.slice(-10);
      messages.push(...limitedHistory);
    }

    messages.push({
      role: "user",
      content: message,
    });

    logger.info("Processing streaming chat request", {
      userId,
      messageLength: message.length,
      historyLength: conversationHistory.length,
    });

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send start event
    const startChunk: StreamingChunk = {
      type: "start",
      metadata: {
        model: model || config.AI_MODEL,
      },
    };
    res.write(`data: ${JSON.stringify(startChunk)}\n\n`);

    const startTime = Date.now();

    try {
      // Stream the response
      const stream = generateStreamingChatCompletion(messages, {
        model,
        temperature,
        maxTokens,
      });

      for await (const chunk of stream) {
        const tokenChunk: StreamingChunk = {
          type: "token",
          content: chunk,
        };
        res.write(`data: ${JSON.stringify(tokenChunk)}\n\n`);
      }

      const latency = Date.now() - startTime;

      // Send end event
      const endChunk: StreamingChunk = {
        type: "end",
        metadata: {
          model: model || config.AI_MODEL,
        },
      };
      res.write(`data: ${JSON.stringify(endChunk)}\n\n`);

      logger.info("Streaming chat completed", {
        userId,
        latency,
      });

      res.end();
    } catch (streamError) {
      logger.error("Error during streaming", {
        error:
          streamError instanceof Error ? streamError.message : "Unknown error",
        userId,
      });

      const errorChunk: StreamingChunk = {
        type: "error",
        error: "Failed to stream response",
      };
      res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
      res.end();
    }
  } catch (error) {
    const userId = (req.user as any)?.id ?? "unknown";

    logger.error("Error setting up streaming chat", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to start streaming chat",
      });
    }
  }
};
