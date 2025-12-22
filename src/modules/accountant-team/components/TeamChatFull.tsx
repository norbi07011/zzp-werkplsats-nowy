/**
 * Team Chat - Full Featured Chat with Channels, Emojis, Stickers, Voice
 * Based on boekhouder-connect Chat.tsx
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Language,
  TeamMember,
  ChatMessage,
  ChatChannel,
  ChatAttachment,
} from "../types";
import {
  DICTIONARY,
  BUSINESS_EMOJIS,
  STICKERS,
  GROUP_COLORS,
} from "../constants";
import {
  Send,
  Plus,
  MessageCircle,
  Hash,
  Smile,
  X,
  Search,
  MoreVertical,
  ArrowLeft,
  Paperclip,
  Mic,
  FileText,
  Play,
  CheckCheck,
  Palette,
  Check,
  Loader2,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  sendMessage as sendMessageToDb,
  getTeamMessages,
  getTeamChannels,
  createChannel,
  initializeDefaultChannels,
  subscribeToTeamChannels,
  AccountantTeamChannel,
} from "../services/accountantTeamService";

interface TeamChatFullProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  members: TeamMember[];
  currentUser: TeamMember;
  language: Language;
  teamId?: string; // Team ID for database sync
  profileId?: string; // User's profile ID for database
}

// GIFs for fun
const GIFS = [
  {
    id: "g1",
    title: "Celebrate",
    url: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
  },
  {
    id: "g2",
    title: "Thumbs Up",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  },
  {
    id: "g3",
    title: "Working",
    url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  },
  {
    id: "g4",
    title: "Stress",
    url: "https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif",
  },
  {
    id: "g5",
    title: "Done",
    url: "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif",
  },
  {
    id: "g6",
    title: "Thinking",
    url: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif",
  },
];

export const TeamChatFull: React.FC<TeamChatFullProps> = ({
  messages,
  setMessages,
  members,
  currentUser,
  language,
  teamId,
  profileId,
}) => {
  const t = DICTIONARY[language];
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Channels loaded from database
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emojis" | "stickers" | "gifs">(
    "emojis"
  );
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
  const [isSending, setIsSending] = useState(false);
  const [attachmentPreview, setAttachmentPreview] =
    useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Find the default channel (first one loaded, usually "Ogólny")
  const defaultChannelId =
    channels.find((c) => c.type === "public")?.id || channels[0]?.id || "";

  const activeChannel = channels.find((c) => c.id === activeChannelId) ||
    channels[0] || {
      id: "",
      name: "Ładowanie...",
      type: "public" as const,
      color: "bg-blue-500",
      unreadCount: 0,
    };
  const activeMessages = messages.filter((m) => {
    if (!activeChannelId) return true; // Show all messages if no channel selected

    // Messages without channel_id go to the default channel
    const messageChannelId = m.channelId || defaultChannelId;
    const matchesChannel = messageChannelId === activeChannelId;

    if (!chatSearch.trim()) return matchesChannel;
    return (
      matchesChannel &&
      m.content.toLowerCase().includes(chatSearch.toLowerCase())
    );
  });
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Load messages from database
  const loadMessages = useCallback(async () => {
    if (!teamId) return;

    setIsLoadingMessages(true);
    try {
      const dbMessages = await getTeamMessages(teamId);
      console.log("📨 [TEAM-CHAT] Raw messages from DB:", dbMessages);

      // Convert database messages to ChatMessage format
      const chatMessages: ChatMessage[] = dbMessages.map((m: any) => {
        const msg = {
          id: m.id,
          channelId: m.channel_id || null, // Keep null if no channel assigned, will be filtered to default
          senderId: m.sender_id,
          senderName: m.sender?.full_name || "Unknown",
          senderAvatar:
            m.sender?.avatar_url ||
            `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`,
          content: m.content,
          timestamp: m.created_at,
          type: m.message_type || "text",
        };
        console.log(
          "📨 [TEAM-CHAT] Converted message:",
          msg.senderName,
          msg.content,
          "channel:",
          msg.channelId
        );
        return msg;
      });

      setMessages(chatMessages);
      console.log("✅ [TEAM-CHAT] Loaded messages:", chatMessages.length);
    } catch (error) {
      console.error("❌ [TEAM-CHAT] Failed to load messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [teamId, setMessages, activeChannelId]);

  // Load channels from database
  const loadChannels = useCallback(async () => {
    if (!teamId || !profileId) return;

    setIsLoadingChannels(true);
    try {
      console.log("📁 [TEAM-CHAT] Loading channels for team:", teamId);
      let dbChannels = await getTeamChannels(teamId);

      // If no channels exist, create default ones
      if (dbChannels.length === 0) {
        console.log("📁 [TEAM-CHAT] No channels found, creating defaults...");
        dbChannels = await initializeDefaultChannels(teamId, profileId);
      }

      // Convert to ChatChannel format
      const chatChannels: ChatChannel[] = dbChannels.map(
        (ch: AccountantTeamChannel) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type === "public" ? "public" : "group",
          color: ch.color.startsWith("bg-") ? ch.color : `bg-[${ch.color}]`,
          unreadCount: 0,
        })
      );

      setChannels(chatChannels);

      // Set first channel as active if none selected
      if (chatChannels.length > 0 && !activeChannelId) {
        setActiveChannelId(chatChannels[0].id);
      }

      console.log("✅ [TEAM-CHAT] Loaded channels:", chatChannels.length);
    } catch (error) {
      console.error("❌ [TEAM-CHAT] Failed to load channels:", error);
    } finally {
      setIsLoadingChannels(false);
    }
  }, [teamId, profileId, activeChannelId]);

  // Load channels on mount and subscribe to changes
  useEffect(() => {
    if (!teamId || !profileId) return;

    loadChannels();

    console.log(
      "🔌 [TEAM-CHAT] Setting up channel subscription for team:",
      teamId
    );

    const channelSub = subscribeToTeamChannels(teamId, (event, channel) => {
      console.log("📁 [TEAM-CHAT] Channel event:", event, channel);

      if (event === "INSERT") {
        const newChannel: ChatChannel = {
          id: channel.id,
          name: channel.name,
          type: channel.type === "public" ? "public" : "group",
          color: channel.color.startsWith("bg-")
            ? channel.color
            : `bg-[${channel.color}]`,
          unreadCount: 0,
        };
        setChannels((prev) => {
          if (prev.some((c) => c.id === newChannel.id)) return prev;
          return [...prev, newChannel];
        });
      } else if (
        event === "DELETE" ||
        (event === "UPDATE" && !channel.is_active)
      ) {
        setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      }
    });

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [teamId, profileId, loadChannels]);

  // Load messages on mount and setup real-time subscription
  useEffect(() => {
    if (!teamId) return;

    loadMessages();

    console.log(
      "🔌 [TEAM-CHAT] Setting up real-time subscription for team:",
      teamId
    );

    // Subscribe to new messages
    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "accountant_team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          console.log(
            "📨 [TEAM-CHAT] New message received via realtime:",
            payload
          );

          // Fetch sender info
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage: ChatMessage = {
            id: payload.new.id,
            channelId: payload.new.channel_id || null, // Keep the actual channel_id from DB
            senderId: payload.new.sender_id,
            senderName: profile?.full_name || "Unknown",
            senderAvatar:
              profile?.avatar_url ||
              `https://ui-avatars.com/api/?name=U&background=6366f1&color=fff`,
            content: payload.new.content,
            timestamp: payload.new.created_at,
            type: payload.new.message_type || "text",
          };

          console.log("📨 [TEAM-CHAT] Adding message to state:", newMessage.id);

          // Only add if not already present (avoid duplicates)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              console.log("⚠️ [TEAM-CHAT] Message already exists, skipping");
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log("🔌 [TEAM-CHAT] Subscription status:", status);
      });

    return () => {
      console.log("🔌 [TEAM-CHAT] Removing subscription for team:", teamId);
      supabase.removeChannel(channel);
    };
  }, [teamId, loadMessages, setMessages]);

  // Scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, attachmentPreview, activeChannelId, isEmojiPickerOpen]);

  // Click outside picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (!teamId || !profileId) {
      toast.error("❌ Brak połączenia z zespołem");
      return;
    }

    try {
      // Save to database
      const savedChannel = await createChannel(
        teamId,
        newGroupName.trim(),
        newGroupColor,
        profileId,
        "group"
      );

      if (!savedChannel) {
        toast.error("❌ Nie udało się utworzyć grupy");
        return;
      }

      // Convert to ChatChannel format and add to state
      const newChannel: ChatChannel = {
        id: savedChannel.id,
        name: savedChannel.name,
        type: "group",
        color: savedChannel.color.startsWith("bg-")
          ? savedChannel.color
          : `bg-[${savedChannel.color}]`,
        unreadCount: 0,
      };

      setChannels((prev) => [...prev, newChannel]);
      setActiveChannelId(newChannel.id);
      setNewGroupName("");
      setIsCreateGroupOpen(false);
      setIsSidebarOpen(false);
      toast.success(`✅ Utworzono grupę #${newGroupName}`);
    } catch (error) {
      console.error("❌ [TEAM-CHAT] Failed to create group:", error);
      toast.error("❌ Nie udało się utworzyć grupy");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentPreview) return;
    if (isSending || !activeChannelId) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText("");
    setAttachmentPreview(null);
    setIsEmojiPickerOpen(false);

    // Create optimistic message for immediate display
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      channelId: activeChannelId,
      senderId: profileId || currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: textToSend,
      timestamp: new Date().toISOString(),
      type: "text",
      attachments: attachmentPreview ? [attachmentPreview] : undefined,
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // If we have teamId and profileId, save to database
      if (teamId && profileId) {
        const savedMessage = await sendMessageToDb(
          teamId,
          profileId,
          textToSend,
          activeChannelId,
          undefined, // replyToId
          currentUser.name, // senderName - dla powiadomień
          activeChannel?.name // channelName - dla powiadomień
        );
        console.log(
          "✅ [TEAM-CHAT] Message sent to database:",
          savedMessage.id,
          "channel:",
          activeChannelId
        );

        // Replace temp message with real one from DB
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: savedMessage.id } : m))
        );
      }
    } catch (error: any) {
      console.error("❌ [TEAM-CHAT] Failed to send message:", error);
      toast.error("❌ Nie udało się wysłać wiadomości");
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleStickerClick = (sticker: (typeof STICKERS)[0]) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: "",
      timestamp: new Date().toISOString(),
      type: "sticker",
      attachments: [
        {
          id: Date.now().toString(),
          type: "image",
          url: `https://placehold.co/200x80/${sticker.color
            .replace("bg-", "")
            .replace("-600", "")
            .replace("-500", "")}/ffffff?text=${sticker.text.replace(
            " ",
            "+"
          )}&font=roboto`,
          name: "Sticker",
        },
      ],
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsEmojiPickerOpen(false);
  };

  const handleGifClick = (gif: (typeof GIFS)[0]) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: "",
      timestamp: new Date().toISOString(),
      type: "sticker",
      attachments: [
        {
          id: Date.now().toString(),
          type: "image",
          url: gif.url,
          name: "GIF",
        },
      ],
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsEmojiPickerOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentPreview({
          id: Date.now().toString(),
          type: isImage ? "image" : "file",
          name: file.name,
          url: event.target?.result as string,
          size: (file.size / 1024).toFixed(1) + " KB",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAttachmentPreview({
          id: Date.now().toString(),
          type: "voice",
          url: audioUrl,
          name: "Voice Note",
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error("Brak dostępu do mikrofonu");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Try to find sender in members, fallback to message data
  const getSender = (senderId: string, msg?: ChatMessage) => {
    // First check if senderId matches profileId of current user
    if (senderId === profileId) {
      return { name: currentUser.name, avatar: currentUser.avatar };
    }
    // Try to find in members
    const member = members.find((m) => m.id === senderId);
    if (member) return { name: member.name, avatar: member.avatar };
    // Use data from message if available
    if (msg?.senderName) {
      return {
        name: msg.senderName,
        avatar:
          msg.senderAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            msg.senderName
          )}&background=6366f1&color=fff`,
      };
    }
    return {
      name: "Unknown",
      avatar: "https://ui-avatars.com/api/?name=U&background=6366f1&color=fff",
    };
  };

  return (
    <div className="flex h-full bg-slate-100 rounded-2xl shadow-xl overflow-hidden border border-slate-200/60 relative">
      {/* Sidebar */}
      <div
        className={`absolute md:static inset-0 z-40 bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 transform
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }
        w-full md:w-80`}
      >
        {/* Sidebar Header */}
        <div className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              className="w-9 h-9 rounded-full"
              alt="Me"
            />
            <span className="font-bold text-slate-700">{t.chat}</span>
          </div>
          <div className="flex gap-2 text-slate-500">
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="p-2 hover:bg-slate-200 rounded-full text-blue-600"
              title={t.new_group}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 md:hidden hover:bg-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative bg-slate-100 rounded-lg flex items-center px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder={t.search}
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Kanały
          </div>
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => {
                setActiveChannelId(channel.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 
                ${
                  activeChannelId === channel.id
                    ? "bg-blue-50 border-blue-500"
                    : "border-transparent"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0 ${channel.color}`}
              >
                <Hash className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {channel.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  Kliknij aby dołączyć...
                </p>
              </div>
              {channel.unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {channel.unreadCount}
                </span>
              )}
            </div>
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#e5e5e5] relative h-full">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#475569 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Chat Header */}
        <div className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 md:px-4 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden flex-1">
            <button
              className="md:hidden mr-1 text-slate-500 hover:bg-slate-200 p-1.5 rounded-full"
              onClick={() => setIsSidebarOpen(true)}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                activeChannel.color || "bg-blue-500"
              }`}
            >
              <Hash className="w-5 h-5" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <h3 className="font-bold text-slate-800 leading-tight truncate text-sm md:text-base">
                {activeChannel.name}
              </h3>
              <span className="text-xs text-slate-500 truncate">
                Kanał grupowy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3 text-slate-500 shrink-0">
            {isChatSearchOpen ? (
              <div className="flex items-center bg-white rounded-full border border-slate-300 px-3 py-1 shadow-sm absolute right-4 left-14 md:static md:w-auto z-20">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder={t.search_messages}
                  className="w-full md:w-48 bg-transparent border-none outline-none text-sm text-slate-700 min-w-[50px]"
                />
                <button
                  onClick={() => {
                    setIsChatSearchOpen(false);
                    setChatSearch("");
                  }}
                  className="ml-2 hover:text-red-500 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsChatSearchOpen(true)}
                className="p-2 hover:bg-slate-200 rounded-full"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10"
          ref={scrollRef}
        >
          {activeMessages.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              {chatSearch
                ? `Brak wyników dla "${chatSearch}"`
                : "Brak wiadomości. Rozpocznij rozmowę!"}
            </div>
          ) : (
            activeMessages.map((msg, index) => {
              const isMe =
                msg.senderId === currentUser.id || msg.senderId === profileId;
              const sender = getSender(msg.senderId, msg);
              // Show name for all messages from others (not just groups)
              const showName =
                !isMe &&
                (index === 0 ||
                  activeMessages[index - 1].senderId !== msg.senderId);

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMe ? "justify-end" : "justify-start"
                  } group mb-1`}
                >
                  <div
                    className={`relative max-w-[85%] md:max-w-[65%] min-w-[120px] rounded-lg shadow-sm px-2 py-1.5 
                    ${
                      isMe
                        ? "bg-[#dcf8c6] rounded-tr-none"
                        : "bg-white rounded-tl-none"
                    }
                    ${
                      chatSearch &&
                      msg.content
                        .toLowerCase()
                        .includes(chatSearch.toLowerCase())
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                  >
                    {showName && (
                      <p
                        className={`text-[11px] font-bold mb-0.5 ${
                          [
                            "text-orange-600",
                            "text-purple-600",
                            "text-blue-600",
                            "text-pink-600",
                          ][parseInt(msg.senderId) % 4]
                        }`}
                      >
                        {sender.name}
                      </p>
                    )}

                    {msg.attachments?.map((att) => (
                      <div key={att.id} className="mb-2 mt-1">
                        {att.type === "image" && (
                          <img
                            src={att.url}
                            alt="attachment"
                            className="rounded-lg max-h-60 object-cover w-full"
                          />
                        )}
                        {att.type === "file" && (
                          <div className="flex items-center bg-black/5 p-2 rounded-lg border border-black/5">
                            <FileText className="w-8 h-8 text-blue-500 mr-2" />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate">
                                {att.name}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase">
                                {att.size || "FILE"}
                              </p>
                            </div>
                          </div>
                        )}
                        {att.type === "voice" && (
                          <div className="flex items-center bg-black/5 p-2 rounded-lg gap-2 min-w-[200px]">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                              <Play className="w-4 h-4 ml-0.5" />
                            </div>
                            <div className="h-1 bg-slate-300 flex-1 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-1/3"></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              0:15
                            </span>
                            <audio src={att.url} className="hidden" controls />
                          </div>
                        )}
                      </div>
                    ))}

                    {msg.content && (
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}

                    <div className="flex justify-end items-center gap-1 mt-1 select-none">
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.timestamp)}
                      </span>
                      {isMe && (
                        <span className="text-blue-500">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Message tail */}
                    <div
                      className={`absolute top-0 w-2.5 h-2.5 ${
                        isMe ? "-right-2" : "-left-2"
                      }`}
                    >
                      <svg
                        viewBox="0 0 10 10"
                        className={`w-full h-full ${
                          isMe ? "text-[#dcf8c6]" : "text-white"
                        } fill-current transform ${isMe ? "" : "scale-x-[-1]"}`}
                      >
                        <path d="M0 0 L10 0 L0 10 Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="bg-slate-50 p-2 sm:p-3 flex items-end gap-2 shrink-0 border-t border-slate-200 relative z-20">
          {/* Attachment Preview */}
          {attachmentPreview && (
            <div className="absolute bottom-full left-0 right-0 bg-slate-100 p-3 border-t border-slate-200 flex items-center gap-4">
              <div className="relative">
                {attachmentPreview.type === "image" ? (
                  <img
                    src={attachmentPreview.url}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                    alt="Preview"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center">
                    {attachmentPreview.type === "voice" ? (
                      <Mic className="w-6 h-6 text-red-500" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                )}
                <button
                  onClick={() => setAttachmentPreview(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">
                  {attachmentPreview.name || "Voice Note"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {attachmentPreview.type.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {/* Emoji/Sticker/GIF Picker */}
          {isEmojiPickerOpen && (
            <div
              ref={pickerRef}
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] bg-white rounded-xl shadow-2xl border border-slate-200 w-[95%] max-w-sm h-80 sm:h-96 flex flex-col overflow-hidden"
            >
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setPickerTab("emojis")}
                  className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${
                    pickerTab === "emojis"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Smile className="w-4 h-4" /> Emojis
                </button>
                <button
                  onClick={() => setPickerTab("stickers")}
                  className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${
                    pickerTab === "stickers"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  📋 Stickers
                </button>
                <button
                  onClick={() => setPickerTab("gifs")}
                  className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${
                    pickerTab === "gifs"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Film className="w-4 h-4" /> GIFs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                {pickerTab === "emojis" && (
                  <div className="grid grid-cols-6 gap-2">
                    {BUSINESS_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-white hover:scale-125 rounded-lg p-2 transition-all shadow-sm border border-transparent hover:border-slate-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {pickerTab === "stickers" && (
                  <div className="grid grid-cols-2 gap-2">
                    {STICKERS.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => handleStickerClick(sticker)}
                        className={`${sticker.color} text-white font-bold py-4 px-2 rounded-xl text-xs shadow-md hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center text-center`}
                      >
                        {sticker.text}
                      </button>
                    ))}
                  </div>
                )}
                {pickerTab === "gifs" && (
                  <div className="grid grid-cols-2 gap-2">
                    {GIFS.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => handleGifClick(gif)}
                        className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200"
                      >
                        <img
                          src={gif.url}
                          alt={gif.title}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                            {gif.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className={`p-2 sm:p-2.5 rounded-full shrink-0 ${
              isEmojiPickerOpen
                ? "bg-blue-100 text-blue-600"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Smile className="w-6 h-6" />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-200 rounded-full"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 min-h-[44px]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isRecording ? "Nagrywanie..." : t.send}
              disabled={isRecording}
              className="w-full bg-transparent border-none outline-none px-4 py-2 text-sm text-slate-800 placeholder-slate-400 h-full min-w-0"
            />
          </div>

          <button
            onClick={() => {
              if (inputText.trim() || attachmentPreview) {
                handleSend();
              } else if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            disabled={isSending}
            className={`p-2.5 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-50
              ${
                isRecording && !(inputText.trim() || attachmentPreview)
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            <span className="flex items-center justify-center w-5 h-5">
              {isSending && <Loader2 className="w-5 h-5 animate-spin" />}
              {!isSending && (inputText.trim() || attachmentPreview) && (
                <Send className="w-5 h-5 ml-0.5" />
              )}
              {!isSending &&
                !(inputText.trim() || attachmentPreview) &&
                isRecording && <div className="w-5 h-5 bg-white rounded-sm" />}
              {!isSending &&
                !(inputText.trim() || attachmentPreview) &&
                !isRecording && <Mic className="w-5 h-5" />}
            </span>
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{t.new_group}</h3>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  {t.group_name}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                  placeholder="np. Audyt 2024"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                  <Palette className="w-4 h-4 mr-1" /> Kolor
                </label>
                <div className="flex gap-2 flex-wrap">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewGroupColor(color)}
                      className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 flex items-center justify-center ${
                        newGroupColor === color
                          ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                          : ""
                      }`}
                    >
                      {newGroupColor === color && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5"
                >
                  {t.create_group}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChatFull;
