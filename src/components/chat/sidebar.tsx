"use client";

import Link from "next/link";
import {
  MessageSquareIcon,
  MessageSquarePlusIcon,
  PanelLeftCloseIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { Chat } from "@/types/chat";

type ChatSidebarProps = {
  chats: Chat[];
  activeChatId: string | null;
  isAuthenticated: boolean;
  isCollapsed?: boolean;
  canCollapse?: boolean;
  mode?: "desktop" | "mobile";
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onToggleCollapse?: () => void;
};

export function Sidebar({
  isCollapsed = false,
  mode = "desktop",
  ...props
}: ChatSidebarProps) {
  const isDesktop = mode === "desktop";

  return (
    <SidebarProvider
      open={isDesktop ? !isCollapsed : true}
      onOpenChange={() => {
        if (isDesktop) {
          props.onToggleCollapse?.();
        }
      }}
    >
      <ChatSidebarContent
        {...props}
        isCollapsed={isCollapsed}
        mode={mode}
      />
    </SidebarProvider>
  );
}

function ChatSidebarContent({
  chats,
  activeChatId,
  isAuthenticated,
  canCollapse = false,
  mode = "desktop",
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onToggleCollapse,
}: ChatSidebarProps) {
  const { open, toggleSidebar } = useSidebar();
  const isDesktop = mode === "desktop";
  const isCollapsed = isDesktop && !open;

  const handleToggle = () => {
    if (isDesktop) {
      toggleSidebar();
      return;
    }

    onToggleCollapse?.();
  };

  return (
    <SidebarRoot
      collapsible={isDesktop && canCollapse ? "icon" : "none"}
      className={cn(
        "relative h-full border-r-0 bg-[#f9f9f9] text-[#0d0d0d]",
        isDesktop ? "min-h-screen lg:sticky lg:top-0 lg:h-screen" : "w-full",
      )}
    >
      <SidebarHeader className={cn("gap-3", isCollapsed ? "items-center px-2" : "px-3 py-3")}>
        {isCollapsed ? (
          <div className="flex flex-1 flex-col gap-2 items-center justify-center pt-3">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md text-[#5f5f67] transition-colors hover:bg-[#efefef] hover:text-[#0d0d0d] cursor-pointer"
              aria-label="Open sidebar"
              onClick={handleToggle}
            >
              <PanelLeftCloseIcon className="size-4 rotate-180" />
            </button>
            {isAuthenticated ? (
              <button
                className={cn(
                  " flex size-8 items-center justify-center rounded-md bg-zinc-700 text-white hover:bg-zinc-700/90 cursor-pointer",
                  isCollapsed ? "justify-center px-0" : "justify-start",
                )}
                onClick={onCreateChat}
              >
                <MessageSquarePlusIcon className="size-4 shrink-0" />
                {!isCollapsed ? <span>New chat</span> : <span className="sr-only">New chat</span>}
              </button>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  "w-full flex size-8 items-center rounded-lg bg-zinc-700 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700/90",
                  isCollapsed ? "justify-center px-0" : "gap-2",
                )}
                aria-label="Sign in to save chats"
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                {!isCollapsed ? (
                  <span>Sign in to save chats</span>
                ) : (
                  <span className="sr-only">Sign in to save chats</span>
                )}
              </Link>
            )}
          </div>
        ) : (
          <>
          <div className="flex w-full items-center justify-between gap-2" >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
                <MessageSquareIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium tracking-tight">Oculus Chat</p>
              </div>
            </div>
            {canCollapse ? (
              <SidebarMenuAction
                className={cn(
                  "opacity-100 cursor-pointer",
                  isCollapsed && isDesktop ? "hidden" : "",
                )}
                aria-label={isDesktop ? "Collapse sidebar" : "Close sidebar"}
                onClick={handleToggle}
              >
                {isDesktop ? (
                  <PanelLeftCloseIcon className="size-4" />
                ) : (
                  <XIcon className="size-4" />
                )}
              </SidebarMenuAction>
            ) : null}
          </div>
          {isAuthenticated ? (
              <button
                className=" w-full flex size-8 items-center gap-2 p-3 justify-center rounded-md bg-zinc-700 text-white hover:bg-zinc-700/90 cursor-pointer"
                onClick={onCreateChat}
              >
                <MessageSquarePlusIcon className="size-4 shrink-0" />
                {!isCollapsed ? <span>New chat</span> : <span className="sr-only">New chat</span>}
              </button>
            ) : (
              <Link
                href="/auth"
                className="w-full flex size-8 p-3 justify-center items-center rounded-xl bg-zinc-700 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700/90 gap-2"
                aria-label="Sign in to save chats"
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                {!isCollapsed ? (
                  <span>Sign in to save chats</span>
                ) : (
                  <span className="sr-only">Sign in to save chats</span>
                )}
              </Link>
            )}
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isCollapsed ? (
          null
        ) : <SidebarGroup>
          <SidebarGroupLabel>
            {isAuthenticated ? "Your Chats" : "Preview"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="mt-2 min-h-0 h-full">
              <SidebarMenu className="pb-4">
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg hover:bg-[#efefef] truncate cursor-pointer",
                        activeChatId === chat.id ? "bg-[#efefef]" : "",
                      )}
                    >
                      <SidebarMenuButton
                        isActive={activeChatId === chat.id}
                        className="min-w-0 flex-1 cursor-pointer"
                        aria-label={chat.title}
                        title={chat.title}
                        onClick={() => onSelectChat(chat.id)}
                      >
                        <span className="line-clamp-1 block">{chat.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        aria-label={`Delete ${chat.title}`}
                        onClick={() => onDeleteChat(chat.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </SidebarMenuAction>
                    </div>
                  </SidebarMenuItem>
                ))}
                {!chats.length && isAuthenticated ? (
                  <p className="px-2 pt-3 text-sm text-[#5f5f67]">
                    Your saved chats will appear here.
                  </p>
                ) : null}
                {!isAuthenticated ? (
                  <p className="px-2 pt-3 text-sm text-[#5f5f67]">
                    Sign in to keep a chat history in this sidebar.
                  </p>
                ) : null}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>}
      </SidebarContent>
    </SidebarRoot>
  );
}
