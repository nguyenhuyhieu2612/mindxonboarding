/**
 * AI Chat Types
 *
 * Type definitions for AI chat functionality including requests, responses,
 * message formats, and streaming data structures.
 */

/**
 * Chat message role types
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * Individual chat message
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

/**
 * Request body for streaming chat completion
 */
export interface StreamingChatRequest {
  message: string;
  systemPrompt?: string;
  conversationHistory?: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Server-Sent Event data structure for streaming
 */
export interface StreamingChunk {
  type: "start" | "token" | "end" | "error";
  content?: string;
  error?: string;
  metadata?: {
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}
