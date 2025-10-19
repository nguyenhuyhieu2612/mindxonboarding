import { Request, Response } from "express";
import httpStatus from "http-status";
import {
  generateStreamingChatCompletion,
  generateChatWithTools,
  ragService,
  mcpToolService,
} from "../services";
import { logger, ApiError } from "../utils";
import { config } from "../config";
import {
  StreamingChatRequest,
  ChatMessage,
  StreamingChunk,
} from "../types/ai.types";

/**
 * Detect if user message requires a specific tool
 * Manual tool detection as fallback for models that don't auto-call tools
 */
function detectToolFromMessage(message: string): {
  toolName: string;
  parameters: Record<string, any>;
} | null {
  const lowerMessage = message.toLowerCase();

  // Pattern 1: User queries (database)
  if (
    lowerMessage.match(
      /(?:có bao nhiêu|hiện tại.*?bao nhiêu|show|list|danh sách|liệt kê|query|get).*?(?:user|người dùng|users|ng dùng|ng dung)/i
    )
  ) {
    return {
      toolName: "query_users",
      parameters: { limit: 10 },
    };
  }

  // Pattern 2: File reading
  if (
    lowerMessage.match(
      /(?:read|đọc|xem|show|hiển thị).*?(?:file|mindx-info|tập tin)/i
    )
  ) {
    return {
      toolName: "read_file",
      parameters: { filename: "mindx-info.txt" },
    };
  }

  // Pattern 3: Weather
  const weatherMatch = lowerMessage.match(
    /(?:weather|thời tiết|nhiệt độ).*?(hanoi|hà nội|ho chi minh|hcm|saigon|sài gòn)/i
  );
  if (weatherMatch) {
    const location = weatherMatch[1].toLowerCase().includes("han")
      ? "Hanoi"
      : "Ho Chi Minh";
    return {
      toolName: "get_weather",
      parameters: { location },
    };
  }

  return null;
}

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

    // Get relevant knowledge from RAG
    const knowledgeContext = await ragService.getContextForChat(message);

    // Build messages array
    const messages: ChatMessage[] = [];

    // Add system prompt with knowledge context
    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${knowledgeContext}`
      : knowledgeContext ||
        "You are a helpful AI assistant for MindX Technology School.";

    if (enhancedSystemPrompt) {
      messages.push({
        role: "system",
        content: enhancedSystemPrompt,
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

/**
 * Chat with tools endpoint
 *
 * @route POST /api/ai/chat/tools
 * @access Protected (requires authentication)
 * @description Chat with AI that can call tools to perform actions
 */
export const chatWithTools = async (
  req: Request<{}, {}, StreamingChatRequest>,
  res: Response
) => {
  try {
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

    // Get available tools
    const availableTools = mcpToolService.getAvailableTools();

    // Get relevant knowledge from RAG
    const knowledgeContext = await ragService.getContextForChat(message);

    // Build messages array
    const messages: ChatMessage[] = [];

    // Add system prompt with knowledge context and tool instructions
    const toolInstructions = `

IMPORTANT: You have access to the following tools that you MUST use when the user asks for:

1. query_users - Use this when user asks about:
   - "show me users"
   - "list users"
   - "how many users"
   - "users in the system"
   
2. read_file - Use this when user asks about:
   - "read the file"
   - "show me file content"
   - "what's in the file"
   
3. get_weather - Use this when user asks about:
   - "weather"
   - "temperature"
   - "how's the weather"

ALWAYS call the appropriate tool when the user's question matches these patterns.
Do NOT say you cannot access the system - you CAN via these tools!
`;

    const enhancedSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${knowledgeContext}\n\n${toolInstructions}`
      : knowledgeContext ||
        "You are a helpful AI assistant for MindX Technology School." +
          toolInstructions;

    messages.push({
      role: "system",
      content: enhancedSystemPrompt,
    });

    if (conversationHistory.length > 0) {
      const limitedHistory = conversationHistory.slice(-10);
      messages.push(...limitedHistory);
    }

    messages.push({
      role: "user",
      content: message,
    });

    logger.info("Processing chat with tools request", {
      userId,
      messageLength: message.length,
      historyLength: conversationHistory.length,
      toolsCount: availableTools.length,
    });

    const startTime = Date.now();

    // ✅ MANUAL TOOL DETECTION: Check if user message matches tool patterns
    const manualToolCall = detectToolFromMessage(message);

    if (manualToolCall) {
      // Force call the detected tool
      logger.info("Manually detected tool call", {
        toolName: manualToolCall.toolName,
        detected: true,
      });

      const toolResult = await mcpToolService.executeTool(
        manualToolCall.toolName,
        manualToolCall.parameters
      );

      logger.info("Tool execution result", {
        success: toolResult.success,
        hasData: !!toolResult.data,
        error: toolResult.error,
      });

      // Format tool result for AI to understand
      let toolResultMessage = "";

      if (toolResult.success && toolResult.data) {
        if (manualToolCall.toolName === "query_users") {
          const users = toolResult.data.users || [];
          toolResultMessage = `DATABASE QUERY RESULT - Found ${users.length} users:\n\n`;
          users.forEach((user: any, index: number) => {
            toolResultMessage += `${index + 1}. ${user.email} - ${
              user.name || "N/A"
            }\n`;
          });
          toolResultMessage += `\nTotal: ${toolResult.data.count} users in the system.`;
        } else if (manualToolCall.toolName === "read_file") {
          toolResultMessage = `FILE CONTENT from ${toolResult.data.filename}:\n\n${toolResult.data.content}`;
        } else if (manualToolCall.toolName === "get_weather") {
          toolResultMessage = `WEATHER DATA for ${toolResult.data.location}:\nTemperature: ${toolResult.data.temperature}°C, Condition: ${toolResult.data.condition}, Humidity: ${toolResult.data.humidity}%`;
        } else {
          toolResultMessage = JSON.stringify(toolResult.data);
        }
      } else {
        toolResultMessage = `ERROR: ${toolResult.error}`;
      }

      // Build response with formatted tool result
      messages.push({
        role: "assistant",
        content: `I have successfully retrieved the data:\n\n${toolResultMessage}`,
      });

      messages.push({
        role: "user",
        content:
          "Based on the data above, answer my original question in Vietnamese. Be specific with the numbers and details.",
      });

      // Get final response from AI
      const finalResponse = await generateChatWithTools(
        messages,
        availableTools,
        { model, temperature, maxTokens }
      );

      const latency = Date.now() - startTime;

      logger.info("Chat with manual tool completed", {
        userId,
        latency,
        toolUsed: manualToolCall.toolName,
      });

      return res.status(httpStatus.OK).json({
        success: true,
        message: finalResponse.content,
        toolsUsed: [manualToolCall.toolName],
        metadata: {
          model: model || config.AI_MODEL,
          latency,
        },
      });
    }

    // Try automatic tool calling (fallback)
    const response = await generateChatWithTools(messages, availableTools, {
      model,
      temperature,
      maxTokens,
    });

    // Check if AI wants to call any tools
    if (response.toolCalls && response.toolCalls.length > 0) {
      logger.info("AI requested tool calls", {
        toolCallsCount: response.toolCalls.length,
      });

      // Execute each tool
      const toolResults = await Promise.all(
        response.toolCalls.map(async (toolCall: any) => {
          const toolName = toolCall.name;
          const toolArgs = toolCall.args || {};

          logger.info("Executing tool", { toolName, toolArgs });

          const result = await mcpToolService.executeTool(toolName, toolArgs);

          return {
            toolName,
            result,
          };
        })
      );

      // Add tool results to messages
      messages.push({
        role: "assistant",
        content: `I'm calling tools: ${response.toolCalls
          .map((tc: any) => tc.name)
          .join(", ")}`,
      });

      messages.push({
        role: "user",
        content: `Tool results:\n${toolResults
          .map(
            (tr) =>
              `${tr.toolName}: ${JSON.stringify(
                tr.result.data || tr.result.error
              )}`
          )
          .join("\n")}`,
      });

      // Get final response from AI with tool results
      const finalResponse = await generateChatWithTools(
        messages,
        availableTools,
        {
          model,
          temperature,
          maxTokens,
        }
      );

      const latency = Date.now() - startTime;

      logger.info("Chat with tools completed", {
        userId,
        latency,
        toolsExecuted: toolResults.length,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: finalResponse.content,
        toolsUsed: toolResults.map((tr) => tr.toolName),
        metadata: {
          model: model || config.AI_MODEL,
          latency,
        },
      });
    } else {
      // No tools needed, return direct response
      const latency = Date.now() - startTime;

      logger.info("Chat with tools completed (no tools used)", {
        userId,
        latency,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: response.content,
        toolsUsed: [],
        metadata: {
          model: model || config.AI_MODEL,
          latency,
        },
      });
    }
  } catch (error) {
    const userId = (req.user as any)?.id ?? "unknown";

    logger.error("Error in chat with tools", {
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
        message: "Failed to process chat with tools",
      });
    }
  }
};
