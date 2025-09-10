import { useState, useEffect } from "react";
import { FiPaperclip, FiSend, FiUsers, FiMoreVertical } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import type { Channel as StreamChannel } from "stream-chat";
import {
  useCreateChatClient,
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { useTRPC } from "@/app/api/trpc/client";
import { LoadingState } from "@/components/loading-state";

// Import Stream Chat CSS (make sure this is imported in your main CSS file)
import "stream-chat-react/dist/css/v2/index.css";

interface ChatUIProps {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage?: string | undefined;
}

export const ChatUI = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: ChatUIProps) => {
  const trpc = useTRPC();
  const { mutateAsync: generateChatToken } = useMutation(
    trpc.meetings.generateChatToken.mutationOptions()
  );
  const [channel, setChannel] = useState<StreamChannel>();

  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      id: userId,
      name: userName,
      image: userImage,
    },
  });

  useEffect(() => {
    if (!client) return;
    
    const initChannel = async () => {
      const ch = client.channel("messaging", meetingId, {
        members: [userId],
      
      });
      
      await ch.watch();
      setChannel(ch);
    };
    
    initChannel();
  }, [client, meetingId, userId, meetingName]);

  if (!client || !channel) {
    return (
      <div className="flex justify-center items-center w-full h-full bg-gradient-to-br from-slate-50 to-slate-100">
        <LoadingState
          title="Connecting to chat..."
          description="Setting up your conversation"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="flex flex-col w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Custom Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 leading-tight">
                {meetingName}
              </h2>
              <p className="text-xs text-slate-500">Live Discussion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 group">
              <FiUsers 
                size={18} 
                className="text-slate-600 group-hover:text-slate-800" 
              />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 group">
              <FiMoreVertical 
                size={18} 
                className="text-slate-600 group-hover:text-slate-800" 
              />
            </button>
          </div>
        </div>

        {/* Stream Chat Container */}
        <div className="flex-1 relative bg-slate-50/30">
          <Chat client={client} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <MessageList />
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                    <label
                      htmlFor="file-upload"
                      className="flex-shrink-0 p-1 text-slate-500 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                    >
                      <FiPaperclip size={20} />
                    </label>
                    <input id="file-upload" type="file" className="hidden" />
                    
                    <MessageInput 
                      focus 
                      
                     
                    />
                  </div>
                </div>
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>
      </div>

      {/* Minimal Custom Styles */}
      <style jsx global>{`
        /* Override only necessary Stream Chat styles */
        .str-chat__main-panel {
          height: 100% !important;
        }

        .str-chat__channel {
          height: 100% !important;
        }

        .str-chat__message-list {
          background: transparent !important;
          padding: 1rem !important;
        }

        .str-chat__message-input {
          border: none !important;
          background: transparent !important;
          padding: 8px 0 !important;
          font-size: 14px !important;
        }

        .str-chat__message-input:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .str-chat__message-input-inner {
          border: none !important;
          background: transparent !important;
        }

        .str-chat__send-button {
          background: #3b82f6 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          margin-left: 8px !important;
        }

        .str-chat__send-button:hover {
          background: #2563eb !important;
        }

        .str-chat__message--me .str-chat__message-bubble {
          background: #3b82f6 !important;
          border-radius: 16px 16px 4px 16px !important;
        }

        .str-chat__message--other .str-chat__message-bubble {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px 16px 16px 4px !important;
        }

        .str-chat__avatar {
          width: 32px !important;
          height: 32px !important;
        }

        .str-chat__message-team {
          margin-bottom: 1rem !important;
        }
      `}</style>
    </div>
  );
};