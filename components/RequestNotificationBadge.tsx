/**
 * REQUEST NOTIFICATIONS BADGE
 * Badge z licznikiem nowych ofert na zlecenia Regular User
 */

import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface RequestNotificationBadgeProps {
  className?: string;
}

export function RequestNotificationBadge({
  className = "",
}: RequestNotificationBadgeProps) {
  const { user } = useAuth();
  const [newOffersCount, setNewOffersCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    loadNewOffersCount();

    // Real-time subscription dla nowych ofert
    const channel = supabase
      .channel("new_offers_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_request_responses",
        },
        async (payload) => {
          // Sprawdź czy nowa oferta dotyczy zlecenia tego usera
          const supabaseAny = supabase as any;
          const { data } = await supabaseAny
            .from("posts")
            .select("author_id")
            .eq("id", payload.new.post_id)
            .single();

          if (data?.author_id === user.id) {
            loadNewOffersCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNewOffersCount = async () => {
    if (!user?.id) return;

    try {
      // Pobierz wszystkie zlecenia użytkownika
      const supabaseAny = supabase as any;
      const { data: userPosts } = await supabaseAny
        .from("posts")
        .select("id")
        .eq("author_id", user.id)
        .eq("request_status", "open");

      if (!userPosts || userPosts.length === 0) {
        setNewOffersCount(0);
        return;
      }

      const postIds = (userPosts as any[]).map((p) => p.id);

      // Policz nowe oferty (pending) dla tych zleceń
      const { count, error } = await supabaseAny
        .from("service_request_responses")
        .select("id", { count: "exact", head: true })
        .in("post_id", postIds)
        .eq("status", "pending");

      if (error) {
        console.error("[NOTIFICATIONS] Error counting offers:", error);
        return;
      }

      setNewOffersCount(count || 0);
    } catch (error) {
      console.error("[NOTIFICATIONS] Unexpected error:", error);
    }
  };

  if (newOffersCount === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}
    >
      {newOffersCount}
    </span>
  );
}
