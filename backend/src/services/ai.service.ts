import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { telemetryService } from "@/services";

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
 * Create Gemini chat model
 */
function createGeminiModel(options: ChatCompletionOptions = {}) {
  return new ChatGoogleGenerativeAI({
    model: options.model || config.AI_MODEL,
    temperature: options.temperature ?? config.AI_TEMPERATURE,
    maxOutputTokens: options.maxTokens || config.AI_MAX_TOKENS,
    apiKey: config.GOOGLE_AI_API_KEY,
  });
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
 * Generate streaming chat completion
 */
export async function* generateStreamingChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): AsyncIterable<string> {
  const startTime = Date.now();

  try {
    logger.info("Starting streaming chat", {
      messageCount: messages.length,
      model: config.AI_MODEL,
    });

    const model = createGeminiModel(options);
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

