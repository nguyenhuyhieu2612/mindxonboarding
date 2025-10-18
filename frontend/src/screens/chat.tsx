import { ChatPanel } from "@/components/chat-panel";
import { HistoryPanel } from "@/components/history-panel";

export const Chat = () => {
  return (
    <div className="gap-1 px-6 flex flex-1 justify-center py-5 items-stretch h-full">
      <HistoryPanel />
      <ChatPanel />
    </div>
  );
};
