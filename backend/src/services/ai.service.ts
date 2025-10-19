import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { config } from "../config";
import { logger } from "../utils";
import { telemetryService } from "../services";
import { MCPTool } from "./mcp-tools.service";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Create Gemini chat model with optional tools
 */
function createGeminiModel(
  options: ChatCompletionOptions = {},
  tools?: MCPTool[]
) {
  const modelConfig: any = {
    model: options.model || config.AI_MODEL,
    temperature: options.temperature ?? config.AI_TEMPERATURE,
    maxOutputTokens: options.maxTokens || config.AI_MAX_TOKENS,
    apiKey: config.GOOGLE_AI_API_KEY,
  };

  // Add tools directly to model config for Gemini
  if (tools && tools.length > 0) {
    modelConfig.tools = convertMCPToolsToGeminiFunctions(tools);
  }

  return new ChatGoogleGenerativeAI(modelConfig);
}

/**
 * Convert messages to LangChain format
 */
function toLangChainMessages(messages: ChatMessage[]) {
  return messages.map((msg) => {
    if (msg.role === "system") return new SystemMessage(msg.content);
    if (msg.role === "assistant") return new AIMessage(msg.content);
    return new HumanMessage(msg.content);
  });
}

/**
 * Convert MCP tools to Gemini function declarations
 * Gemini API expects "functionDeclarations" wrapper
 */
function convertMCPToolsToGeminiFunctions(tools: MCPTool[]) {
  const formattedTools = [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ];

  // Debug log
  logger.info("Converted tools to Gemini format", {
    toolCount: tools.length,
    formattedTools: JSON.stringify(formattedTools, null, 2),
  });

  return formattedTools;
}

/**
 * Generate streaming chat completion with optional tool support
 */
export async function* generateStreamingChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
  tools?: MCPTool[]
): AsyncIterable<string> {
  const startTime = Date.now();

  try {
    logger.info("Starting streaming chat", {
      messageCount: messages.length,
      model: config.AI_MODEL,
      toolsEnabled: !!tools,
    });

    const model = createGeminiModel(options, tools);
    const langChainMessages = toLangChainMessages(messages);
    const stream = await model.stream(langChainMessages);

    let chunks = 0;

    for await (const chunk of stream) {
      const content = chunk.content as string;
      if (content) {
        chunks++;
        yield content;
      }
    }

    const duration = Date.now() - startTime;

    telemetryService.trackEvent("ai_streaming_completion", {
      model: config.AI_MODEL,
      duration,
      chunks,
      success: true,
    });

    logger.info("Streaming completed", {
      model: config.AI_MODEL,
      duration,
      chunks,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Streaming error", {
      error: error instanceof Error ? error.message : "Unknown",
      duration,
    });

    telemetryService.trackError(
      error instanceof Error ? error : new Error("Streaming error")
    );
    telemetryService.trackEvent("ai_streaming_error", {
      duration,
      error: error instanceof Error ? error.message : "Unknown",
    });

    throw error;
  }
}

/**
 * Generate chat completion with tool calling support (non-streaming for tool execution)
 */
export async function generateChatWithTools(
  messages: ChatMessage[],
  tools: MCPTool[],
  options: ChatCompletionOptions = {}
): Promise<{ content: string; toolCalls?: any[] }> {
  const startTime = Date.now();

  try {
    logger.info("Starting chat with tools", {
      messageCount: messages.length,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
      model: config.AI_MODEL,
    });

    const model = createGeminiModel(options, tools);
    const langChainMessages = toLangChainMessages(messages);

    logger.info("Invoking model with tools bound");
    const response = await model.invoke(langChainMessages);

    const duration = Date.now() - startTime;

    // Check if AI wants to call any tools
    const toolCalls = (response as any).tool_calls || [];

    logger.info("Model response received", {
      hasToolCalls: toolCalls.length > 0,
      toolCallsCount: toolCalls.length,
      toolCallNames: toolCalls.map((tc: any) => tc.name),
      responseType: typeof response.content,
    });

    telemetryService.trackEvent("ai_chat_with_tools", {
      model: config.AI_MODEL,
      duration,
      toolCallsCount: toolCalls.length,
      success: true,
    });

    logger.info("Chat with tools completed", {
      model: config.AI_MODEL,
      duration,
      toolCallsCount: toolCalls.length,
    });

    return {
      content: response.content as string,
      toolCalls,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Chat with tools error", {
      error: error instanceof Error ? error.message : "Unknown",
      duration,
    });

    telemetryService.trackError(
      error instanceof Error ? error : new Error("Chat with tools error")
    );

    throw error;
  }
}
