import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { deriveChatTitle } from "@/server/services/chat-title";
import type { Chat } from "@/types/chat";

function mapChat(row: Record<string, unknown>): Chat {
  return {
    id: String(row.id),
    title: String(row.title),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listChats(userId: string) {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("chats")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapChat);
}

export async function getChatById(chatId: string, userId: string) {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("chats")
    .select("id, title, created_at, updated_at")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapChat(data) : null;
}

export async function createChat(userId: string, firstMessage?: string) {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("chats")
    .insert({
      user_id: userId,
      title: deriveChatTitle(firstMessage ?? "New chat"),
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapChat(data);
}

export async function deleteChat(chatId: string, userId: string) {
  const admin = getAdminSupabaseClient();
  const { error } = await admin
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function touchChat(chatId: string, userId: string, title?: string) {
  const admin = getAdminSupabaseClient();
  const update: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString(),
  };

  if (title) {
    update.title = deriveChatTitle(title);
  }

  const { error } = await admin
    .from("chats")
    .update(update)
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
