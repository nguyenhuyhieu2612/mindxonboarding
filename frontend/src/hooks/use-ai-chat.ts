import { useState, useCallback } from "react";
import { streamChatMessage, chatWithTools, ChatMessage } from "@/services/ai";
import { trackGA4Event } from "@/lib/analytics";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolsUsed?: string[]; // Tools that were used for this message
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolsEnabled, setToolsEnabled] = useState(false); // Toggle for tools mode

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessage.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setError(null);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      const startTime = Date.now();

      try {
        // Prepare conversation history
        const conversationHistory: ChatMessage[] = messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        }));

        // Track event
        trackGA4Event("ai_chat_start", {
          message_length: userMessage.length,
          tools_enabled: toolsEnabled,
        });

        if (toolsEnabled) {
          // ✅ TOOLS MODE: Non-streaming with tool calling
          const response = await chatWithTools({
            message: userMessage,
            conversationHistory,
          });

          const duration = Date.now() - startTime;

          // Update message with tool results
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsg.id
                ? {
                    ...msg,
                    content: response.message,
                    toolsUsed: response.toolsUsed,
                  }
                : msg
            )
          );

          // Track success
          trackGA4Event("ai_chat_with_tools_complete", {
            duration,
            tools_used: response.toolsUsed?.join(", ") || "none",
            response_length: response.message.length,
          });
        } else {
          // ✅ STREAMING MODE: Real-time streaming
          const stream = streamChatMessage({
            message: userMessage,
            conversationHistory,
          });

          let fullContent = "";

          for await (const chunk of stream) {
            fullContent += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          }

          const duration = Date.now() - startTime;

          // Track success
          trackGA4Event("ai_chat_complete", {
            duration,
            response_length: fullContent.length,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get AI response";
        setError(errorMessage);

        // Remove the assistant message if error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsg.id));

        // Track error
        trackGA4Event("ai_chat_error", {
          error: errorMessage,
          tools_enabled: toolsEnabled,
        });

        console.error("AI Chat Error:", err);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, toolsEnabled]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const toggleTools = useCallback(() => {
    setToolsEnabled((prev) => !prev);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    toolsEnabled,
    toggleTools,
  };
};
