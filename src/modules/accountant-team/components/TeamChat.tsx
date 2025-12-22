/**
 * Team Chat - Group Chat with Channels
 */

import React, { useState, useRef, useEffect } from "react";
import { Language, TeamMember, ChatMessage, ChatChannel } from "../types";
import { DICTIONARY, STICKERS, BUSINESS_EMOJIS } from "../constants";
import {
  Send,
  Plus,
  MessageCircle,
  Users,
  Smile,
  Link,
  MoreVertical,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface TeamChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  members: TeamMember[];
  currentUser: TeamMember;
  language: Language;
}

export const TeamChat: React.FC<TeamChatProps> = ({
  messages,
  setMessages,
  members,
  currentUser,
  language,
}) => {
  const t = DICTIONARY[language];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [channels, setChannels] = useState<ChatChannel[]>([
    { id: "general", name: "Ogólny", type: "public", unreadCount: 0 },
    { id: "btw", name: "BTW & VAT", type: "public", unreadCount: 0 },
    { id: "urgent", name: "Pilne", type: "public", unreadCount: 0 },
  ]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter messages by channel
  const channelMessages = messages.filter((m) => m.channelId === activeChannel);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: activeChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const createChannel = () => {
    if (!newChannelName.trim()) {
      toast.error("Podaj nazwę kanału");
      return;
    }

    const channel: ChatChannel = {
      id: crypto.randomUUID(),
      name: newChannelName,
      type: "public",
      unreadCount: 0,
    };

    setChannels((prev) => [...prev, channel]);
    setNewChannelName("");
    setShowNewChannel(false);
    setActiveChannel(channel.id);
    toast.success(`✅ Utworzono kanał #${newChannelName}`);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Dzisiaj";
    if (date.toDateString() === yesterday.toDateString()) return "Wczoraj";
    return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  };

  // Group messages by date
  const groupedMessages: { [key: string]: ChatMessage[] } = {};
  channelMessages.forEach((msg) => {
    const dateKey = formatDate(msg.timestamp);
    if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
    groupedMessages[dateKey].push(msg);
  });

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      {/* Channels Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Kanały</h3>
          <button
            onClick={() => setShowNewChannel(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nowy kanał
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                activeChannel === channel.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="flex-1 truncate">{channel.name}</span>
              {channel.unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {channel.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Online Members */}
        <div className="p-4 border-t border-slate-200">
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            Online ({members.filter((m) => m.status === "Online").length})
          </h4>
          <div className="space-y-1">
            {members
              .filter((m) => m.status === "Online")
              .slice(0, 5)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                  </div>
                  <span className="truncate">{member.name.split(" ")[0]}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium text-slate-800">
              {channels.find((c) => c.id === activeChannel)?.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Brak wiadomości</p>
              <p className="text-sm">
                Rozpocznij rozmowę w #
                {channels.find((c) => c.id === activeChannel)?.name}
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                {msgs.map((message) => (
                  <div
                    key={message.id}
                    className="flex gap-3 mb-4 group hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg"
                  >
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="w-10 h-10 rounded-full shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-slate-800">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-600 break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Wiadomość do #${
                  channels.find((c) => c.id === activeChannel)?.name
                }...`}
                className="w-full px-4 py-3 pr-24 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                  <Link className="w-5 h-5" />
                </button>
              </div>

              {/* Emoji Picker */}
              {showEmojis && (
                <div className="absolute bottom-full right-0 mb-2 p-3 bg-white rounded-xl shadow-xl border border-slate-200 w-64">
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nowy kanał</h3>
              <button
                onClick={() => setShowNewChannel(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nazwa kanału
              </label>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) =>
                    setNewChannelName(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    )
                  }
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="np. klienci-vip"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewChannel(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Anuluj
              </button>
              <button
                onClick={createChannel}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Utwórz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;
