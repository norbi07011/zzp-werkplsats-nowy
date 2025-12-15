import React, { useState, useEffect, useRef } from "react";
import {
  useProjectChat,
  type ChatMessage,
  type ChatChannel,
} from "../hooks/useProjectChat";
import { useAuth } from "../contexts/AuthContext";
import {
  Send,
  Hash,
  Lock,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Smile,
} from "lucide-react";

interface ChatProps {
  projectId: string;
}

export function Chat({ projectId }: ChatProps) {
  const { user } = useAuth();
  const {
    channels,
    messages,
    loading,
    error,
    fetchChannels,
    createChannel,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useProjectChat(projectId);

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showChannelForm, setShowChannelForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannelId) return;

    try {
      await sendMessage(messageInput, "text");
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const getChannelIcon = (channel: ChatChannel) => {
    if (channel.is_private) {
      return <Lock className="w-4 h-4 text-gray-500" />;
    }
    return <Hash className="w-4 h-4 text-gray-500" />;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("pl-PL", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  if (loading && channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        Error loading chat: {error}
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Kanały</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                activeChannelId === channel.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {getChannelIcon(channel)}
              <span className="flex-1 text-left text-sm font-medium truncate">
                {channel.name}
              </span>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => setShowChannelForm(true)}
            className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            + Nowy kanał
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {activeChannel && (
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getChannelIcon(activeChannel)}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {activeChannel.name}
                </h3>
                {activeChannel.description && (
                  <p className="text-sm text-gray-500">
                    {activeChannel.description}
                  </p>
                )}
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeChannel ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Wybierz kanał aby rozpocząć konwersację
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Brak wiadomości. Napisz coś!
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user?.id;
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {message.sender_id.substring(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    <div
                      className={`flex-1 max-w-md ${
                        isOwnMessage ? "items-end" : "items-start"
                      } flex flex-col`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message_text}
                        </p>
                        {message.is_edited && (
                          <span className="text-xs opacity-70 ml-2">
                            (edytowane)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        {activeChannel && (
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Napisz wiadomość..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
                  />
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Smile className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
