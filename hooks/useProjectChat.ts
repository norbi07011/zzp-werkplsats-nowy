import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface ChatChannel {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  channel_type: "general" | "task" | "team" | "private";
  is_private: boolean;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  message_text?: string;
  message_type: "text" | "image" | "file" | "system";
  file_url?: string;
  file_name?: string;
  file_size?: number;
  parent_message_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  channel_id: string;
  parent_message_id: string;
  title?: string;
  created_at: string;
}

export function useProjectChat(projectId?: string, channelId?: string) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelSubscription = useRef<RealtimeChannel | null>(null);

  // Fetch channels
  const fetchChannels = async () => {
    if (!projectId) {
      setChannels([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("project_chat_groups")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setChannels(data || []);
    } catch (err: any) {
      console.error("Error fetching channels:", err);
    }
  };

  // Create channel
  const createChannel = async (
    name: string,
    channelType: "general" | "task" | "team" | "private" = "general",
    description?: string,
    isPrivate: boolean = false
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from("project_chat_groups")
        .insert([
          {
            project_id: projectId,
            name: name,
            description: description,
            channel_type: channelType,
            is_private: isPrivate,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setChannels((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error("Error creating channel:", err);
      throw err;
    }
  };

  // Fetch messages
  const fetchMessages = async (limit: number = 50) => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("project_chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (fetchError) throw fetchError;
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (
    messageText: string,
    messageType: "text" | "image" | "file" = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    parentMessageId?: string
  ) => {
    try {
      const { data, error: createError } = await supabase
        .from("project_chat_messages")
        .insert([
          {
            channel_id: channelId,
            sender_id: user?.id,
            message_text: messageText,
            message_type: messageType,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            parent_message_id: parentMessageId,
            is_edited: false,
            is_deleted: false,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      // Message will be added via realtime subscription
      return data;
    } catch (err: any) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newText: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_chat_messages")
        .update({
          message_text: newText,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", user?.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)));
      return data;
    } catch (err: any) {
      console.error("Error editing message:", err);
      throw err;
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("project_chat_messages")
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", user?.id);

      if (updateError) throw updateError;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err: any) {
      console.error("Error deleting message:", err);
      throw err;
    }
  };

  // Fetch thread messages
  const fetchThreadMessages = async (parentMessageId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("project_chat_messages")
        .select("*")
        .eq("parent_message_id", parentMessageId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching thread messages:", err);
      return [];
    }
  };

  // Subscribe to real-time messages
  const subscribeToChannel = () => {
    if (!channelId || channelSubscription.current) return;

    channelSubscription.current = supabase
      .channel(`chat:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();
  };

  // Unsubscribe from channel
  const unsubscribeFromChannel = () => {
    if (channelSubscription.current) {
      supabase.removeChannel(channelSubscription.current);
      channelSubscription.current = null;
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [projectId]);

  useEffect(() => {
    if (channelId) {
      fetchMessages();
      subscribeToChannel();
    }

    return () => {
      unsubscribeFromChannel();
    };
  }, [channelId]);

  return {
    channels,
    messages,
    loading,
    error,
    fetchChannels,
    createChannel,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    fetchThreadMessages,
  };
}
