"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function useRealtimeSync(userId?: string, activeChatId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = getBrowserSupabaseClient();
    const chatsChannel = supabase
      .channel(`chats:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chats"] });
        },
      )
      .subscribe();

    const messagesChannel = activeChatId
      ? supabase
          .channel(`messages:${activeChatId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `chat_id=eq.${activeChatId}`,
            },
            () => {
              void queryClient.invalidateQueries({
                queryKey: ["messages", activeChatId],
              });
            },
          )
          .subscribe()
      : null;

    return () => {
      void supabase.removeChannel(chatsChannel);
      if (messagesChannel) {
        void supabase.removeChannel(messagesChannel);
      }
    };
  }, [activeChatId, queryClient, userId]);
}
