import { useState, useRef, useEffect } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";

export const ChatPanel = () => {
  const [input, setInput] = useState("");
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    toolsEnabled,
    toggleTools,
  } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="h-full layout-content-container flex flex-col max-w-[960px] flex-1">
      <div className="flex flex-wrap justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-white tracking-light text-[32px] font-bold leading-tight">
            AI Chat Assistant
          </p>
          <p className="text-[#96c5a8] text-sm">
            {toolsEnabled
              ? "🔧 Tools Mode: AI can query database, read files, and call APIs"
              : "💬 Streaming Mode: Real-time responses"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Tools Toggle */}
          <button
            onClick={toggleTools}
            className={`flex min-w-[120px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal transition-colors ${
              toolsEnabled
                ? "bg-[#39e079] text-[#122118] hover:bg-[#2cc764]"
                : "bg-[#264532] text-white hover:bg-[#39e079] hover:text-[#122118]"
            }`}
            title={
              toolsEnabled
                ? "Disable tools (switch to streaming)"
                : "Enable tools (AI can query DB, read files, etc.)"
            }
          >
            <span className="truncate">
              {toolsEnabled ? "🔧 Tools ON" : "💬 Tools OFF"}
            </span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={clearMessages}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#264532] text-white text-sm font-medium leading-normal hover:bg-[#39e079] hover:text-[#122118] transition-colors"
          >
            <span className="truncate">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#96c5a8] mt-10 space-y-4">
            <div>
              <p className="text-lg">Start a conversation with AI</p>
              <p className="text-sm mt-2">
                Ask me anything, and I'll help you find the answer.
              </p>
            </div>

            {toolsEnabled && (
              <div className="bg-[#39e079]/10 border border-[#39e079]/30 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-[#39e079] font-semibold mb-2">
                  🔧 Tools Mode Active
                </p>
                <p className="text-sm text-[#96c5a8] mb-3">
                  Try these commands to test MCP tools:
                </p>
                <ul className="text-xs space-y-1 text-[#96c5a8]">
                  <li>• "Show me list of users in the system"</li>
                  <li>• "Read the mindx-info.txt file"</li>
                  <li>• "What's the weather in Hanoi?"</li>
                  <li>• "How many users are registered?"</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
              style={{
                backgroundImage:
                  message.role === "user"
                    ? `url("https://ui-avatars.com/api/?name=You&background=264532&color=fff")`
                    : `url("https://ui-avatars.com/api/?name=AI&background=39e079&color=122118")`,
              }}
            ></div>
            <div className="flex flex-1 flex-col items-stretch gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-white text-base font-bold leading-tight">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </p>
                <p className="text-white text-base font-normal leading-normal whitespace-pre-wrap">
                  {message.content}
                </p>
                {/* Show tools used badge */}
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[#96c5a8] text-xs">
                      🔧 Tools used:
                    </span>
                    {message.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#39e079]/20 text-[#39e079] border border-[#39e079]/30"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="text-[#96c5a8] text-sm">
            <span className="inline-block animate-pulse">AI is typing...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="px-4 py-3 gap-3">
        <div className="flex w-full items-stretch rounded-lg">
          <input
            placeholder="Message AI..."
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#264532] focus:border-none h-12 placeholder:text-[#96c5a8] px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
          />
          <div className="flex border-none bg-[#264532] items-center justify-center rounded-r-lg border-l-0 pr-2">
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#39e079] text-[#122118] text-sm font-medium leading-normal disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2cc764] transition-colors"
            >
              <span className="truncate">
                {isStreaming ? "Sending..." : "Send"}
              </span>
            </button>
          </div>
        </div>
      </form>

      <p className="text-[#96c5a8] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  );
};
