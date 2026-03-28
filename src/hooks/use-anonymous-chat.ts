"use client";

import { useEffect, useState } from "react";
import { MAX_ANONYMOUS_MESSAGES } from "@/lib/constants";
import type { Message } from "@/types/chat";

const STORAGE_KEY = "orbit-chat-anonymous";

type AnonymousState = {
  messages: Message[];
  usedMessages: number;
};

const initialState: AnonymousState = {
  messages: [],
  usedMessages: 0,
};

export function useAnonymousChat() {
  const [state, setState] = useState<AnonymousState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }

    try {
      return JSON.parse(raw) as AnonymousState;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const remainingMessages = MAX_ANONYMOUS_MESSAGES - state.usedMessages;

  return {
    messages: state.messages,
    remainingMessages,
    canSend: remainingMessages > 0,
    appendConversation(userText: string, assistantText: string) {
      setState((current) => ({
        usedMessages: current.usedMessages + 1,
        messages: [
          ...current.messages,
          {
            id: crypto.randomUUID(),
            chatId: "anonymous",
            role: "user",
            content: userText,
            createdAt: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            chatId: "anonymous",
            role: "assistant",
            content: assistantText,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    reset() {
      setState(initialState);
    },
  };
}
