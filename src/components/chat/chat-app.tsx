"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuIcon } from "lucide-react";
import {
  createChat,
  deleteChat,
  fetchChats,
  fetchMe,
  fetchMessages,
  logout,
  requestChatReply,
  uploadFile,
} from "@/lib/api";
import { AuthGuard } from "@/components/chat/auth-guard";
import { ChatLayout } from "@/components/chat/chat-layout";
import { EmptyState } from "@/components/chat/empty-state";
import { LoadingIndicator } from "@/components/chat/loading-indicator";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import { Sidebar } from "@/components/chat/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAnonymousChat } from "@/hooks/use-anonymous-chat";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import type { Message, UploadedFile } from "@/types/chat";

const WRITING_STATUS_DELAY_MS = 350;

function createAssistantStatusMessage(chatId: string, content: string): Message {
  return {
    id: "pending-assistant",
    chatId,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

function waitForWritingState() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, WRITING_STATUS_DELAY_MS);
  });
}

function updatePendingAssistantMessage(chatId: string, content: string) {
  return (current: Message[]) =>
    current.map((message) =>
      message.id === "pending-assistant" && message.chatId === chatId
        ? { ...message, content: content || "Thinking..." }
        : message,
    );
}

function areSameMessage(a: Message, b: Message) {
  const aAttachments = a.attachments ?? [];
  const bAttachments = b.attachments ?? [];

  return (
    a.chatId === b.chatId &&
    a.role === b.role &&
    a.content === b.content &&
    aAttachments.length === bAttachments.length &&
    aAttachments.every((attachment, index) => attachment.id === bAttachments[index]?.id)
  );
}

function mergeMessagesWithPending(messages: Message[], pendingMessages: Message[]) {
  let duplicateCount = 0;

  while (
    duplicateCount < messages.length &&
    duplicateCount < pendingMessages.length &&
    areSameMessage(
      messages[messages.length - 1 - duplicateCount],
      pendingMessages[pendingMessages.length - 1 - duplicateCount],
    )
  ) {
    duplicateCount += 1;
  }

  if (!duplicateCount) {
    return [...messages, ...pendingMessages];
  }

  return [...messages, ...pendingMessages.slice(0, pendingMessages.length - duplicateCount)];
}

export function ChatApp() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const anonymousChat = useAnonymousChat();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await fetchMe()).user,
  });

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: async () => (await fetchChats()).chats,
    enabled: !!meQuery.data,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", activeChatId],
    queryFn: async () => (await fetchMessages(activeChatId!)).messages,
    enabled: !!meQuery.data && !!activeChatId,
  });

  useRealtimeSync(meQuery.data?.id, isResponding ? undefined : activeChatId ?? undefined);

  useEffect(() => {
    if (meQuery.data && chatsQuery.data?.length && !activeChatId) {
      startTransition(() => setActiveChatId(chatsQuery.data[0].id));
    }
  }, [activeChatId, chatsQuery.data, meQuery.data]);

  const createChatMutation = useMutation({
    mutationFn: createChat,
    onSuccess: async ({ chat }) => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      setActiveChatId(chat.id);
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: async (_result, chatId) => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["chats"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      setActiveChatId(null);
      setPendingMessages([]);
      router.refresh();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: ({ file }) => {
      setPendingFiles((current) => [...current, file]);
    },
  });

  const chatMessages = useMemo(() => {
    if (!meQuery.data) {
      return [...anonymousChat.messages, ...pendingMessages];
    }

    return mergeMessagesWithPending(messagesQuery.data ?? [], pendingMessages);
  }, [anonymousChat.messages, meQuery.data, messagesQuery.data, pendingMessages]);

  const isChatListLoading = !!meQuery.data && chatsQuery.isLoading;
  const hasLoadedMessages =
    Array.isArray(messagesQuery.data) && messagesQuery.data.length > 0;
  const isInitialMessagesLoading =
    !!meQuery.data &&
    !!activeChatId &&
    messagesQuery.isLoading &&
    !hasLoadedMessages &&
    !pendingMessages.length;
  const shouldShowChatLoader = isChatListLoading || isInitialMessagesLoading;

  const sendMessage = async (content: string) => {
    setIsResponding(true);
    setChatError(null);

    if (!meQuery.data) {
      if (!anonymousChat.canSend) {
        setIsResponding(false);
        router.push("/auth");
        return;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        chatId: "anonymous",
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      const history = anonymousChat.messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const assistantMessage = createAssistantStatusMessage("anonymous", "");

      setPendingMessages([userMessage, assistantMessage]);

      try {
        const response = await requestChatReply({
          chatId: "anonymous",
          content,
          history,
        }, {
          onChunk: (nextContent) => {
            setPendingMessages(updatePendingAssistantMessage("anonymous", nextContent));
          },
        });

        await waitForWritingState();
        anonymousChat.appendConversation(content, response.message.content);
        setPendingFiles([]);
        setPendingMessages([]);
      } catch (error) {
        setChatError(
          error instanceof Error
            ? error.message
            : "The assistant could not answer right now.",
        );
        setPendingMessages([]);
      } finally {
        setIsResponding(false);
      }
      return;
    }

    let chatId = activeChatId;
    if (!chatId) {
      try {
        chatId = (
          await createChatMutation.mutateAsync({
            firstMessage: content,
          })
        ).chat.id;
      } catch (error) {
        setChatError(
          error instanceof Error
            ? error.message
            : "The assistant could not answer right now.",
        );
        setIsResponding(false);
        return;
      }
    }

    setActiveChatId(chatId);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      attachments: pendingFiles,
    };
    const assistantMessage = createAssistantStatusMessage(chatId, "");
    setPendingMessages([userMessage, assistantMessage]);

    try {
      await requestChatReply({
        chatId,
        content,
        fileIds: pendingFiles.map((file) => file.id),
      }, {
        onChunk: (nextContent) => {
          setPendingMessages(updatePendingAssistantMessage(chatId, nextContent));
        },
      });

      await waitForWritingState();
      await queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      setPendingFiles([]);
      setPendingMessages([]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "The assistant could not answer right now.",
      );
      setPendingMessages([]);
    } finally {
      setIsResponding(false);
    }
  };

  const chats = chatsQuery.data ?? [];
  const sidebar = (
    <Sidebar
      mode="desktop"
      chats={chats}
      activeChatId={activeChatId}
      isAuthenticated={!!meQuery.data}
      isCollapsed={isSidebarCollapsed}
      canCollapse
      onSelectChat={(chatId) => {
        setActiveChatId(chatId);
        setIsSidebarOpen(false);
      }}
      onCreateChat={() => {
        createChatMutation.mutate(undefined);
        setIsSidebarOpen(false);
      }}
      onDeleteChat={(chatId) => deleteChatMutation.mutate(chatId)}
      onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
    />
  );

  const mobileSidebar = (
    <Sidebar
      mode="mobile"
      chats={chats}
      activeChatId={activeChatId}
      isAuthenticated={!!meQuery.data}
      onSelectChat={(chatId) => {
        setActiveChatId(chatId);
        setIsSidebarOpen(false);
      }}
      onCreateChat={() => {
        createChatMutation.mutate(undefined);
        setIsSidebarOpen(false);
      }}
      onDeleteChat={(chatId) => deleteChatMutation.mutate(chatId)}
      canCollapse
      onToggleCollapse={() => setIsSidebarOpen(false)}
    />
  );

  const header = (
    <header className="sticky top-0 z-20 border-b border-black/6 bg-white/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-white/80 md:px-8">
      <div className="flex gap-3 flex-row items-center justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-0.5 rounded-full bg-white lg:hidden"
            aria-label="Open sidebar"
            onClick={() => setIsSidebarOpen(true)}
          >
            <MenuIcon className="size-4" />
          </Button>
          <div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {meQuery.isLoading ? <LoadingIndicator label="Checking session..." /> : null}
          {meQuery.data ? (
            <>
              <span className="text-sm text-[#6f6f77]">{meQuery.data.email}</span>
              <Button
                type="button"
                variant="outline"
                className="rounded-full bg-white"
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#2f2f2f]"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent
          side="left"
          className="w-65 max-w-65 min-w-65 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          showCloseButton={false}
        >
          {mobileSidebar}
        </SheetContent>
      </Sheet>
      <ChatLayout
        sidebar={sidebar}
        header={header}
        isSidebarCollapsed={isSidebarCollapsed}
        composer={
          <div className="space-y-3 pt-3">
            {!meQuery.data && <AuthGuard remainingMessages={anonymousChat.remainingMessages} />}
            {chatError && (
              <div className="mx-auto w-full max-w-3xl rounded-[22px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {chatError}
              </div>
            )}
            <MessageInput
              disabled={isResponding}
              canUpload={!!meQuery.data}
              pendingFiles={pendingFiles}
              onSubmit={sendMessage}
              onFilesSelected={(files) => {
                Array.from(files).forEach((file) => {
                  uploadMutation.mutate(file);
                });
              }}
            />
          </div>
        }
      >
        {chatMessages.length || shouldShowChatLoader ? (
          <MessageList
            messages={chatMessages}
            isStreaming={isResponding}
            isLoading={shouldShowChatLoader}
          />
        ) : (
          <EmptyState
            title="Start a conversation"
            description="Create a new thread, ask a question, or upload a document once you're signed in. Replies stream in live, and saved chats sync automatically."
          />
        )}
      </ChatLayout>
    </>
  );
}
