"use client";

import { useEffect, useRef } from "react";
import { useEffectEvent } from "react";
import { BotIcon, UserIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingIndicator } from "@/components/chat/loading-indicator";
import type { Message } from "@/types/chat";

export function MessageList({
  messages,
  isStreaming,
  isLoading = false,
}: {
  messages: Message[];
  isStreaming: boolean;
  isLoading?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = useEffectEvent(() => {
    const viewport = rootRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="rounded-2xl border border-black/8 bg-white/90 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <LoadingIndicator label="Loading meassges..." />
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return null;
  }

  return (
    <div ref={rootRef} className="h-full">
      <ScrollArea className="h-full">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-1 py-6 md:px-6">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role !== "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-white">
                  <BotIcon className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-[1.75rem] px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-[#efefef] text-[#2f2f2f] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/6"
                    : "bg-[#efefef] text-[#2f2f2f] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/6"
                }`}
              >
                {message.content ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : message.role === "assistant" && isStreaming ? (
                  <LoadingIndicator label="AI is thinking" />
                ) : null}
              </div>
              {message.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#efefef] text-[#5f5f67]">
                  <UserIcon className="size-4" />
                </div>
              )}
            </article>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
