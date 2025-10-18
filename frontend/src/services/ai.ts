export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  systemPrompt?: string;
  conversationHistory?: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

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

/**
 * Send chat message with streaming response
 * Returns an async generator that yields string chunks
 */
export async function* streamChatMessage(
  request: ChatRequest
): AsyncGenerator<string, void, unknown> {
  const state = (await import("@/store")).store.getState();
  const accessToken = state.auth.accessToken;

  const baseURL =
    (import.meta as any).env?.DEV === true
      ? "http://localhost:3000"
      : window.location.origin + "/api";

  const response = await fetch(`${baseURL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const chunk: StreamingChunk = JSON.parse(data);

              if (chunk.type === "token" && chunk.content) {
                yield chunk.content;
              } else if (chunk.type === "error") {
                throw new Error(chunk.error || "Streaming error");
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
