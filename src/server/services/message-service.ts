import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Message, UploadedFile } from "@/types/chat";

const FILE_SELECT =
  "id, name, mime_type, byte_size, storage_path, url, extracted_text, created_at";
const FILE_ACCESS_ERROR = "One or more files are unavailable for this user";

function mapFile(row: Record<string, unknown>): UploadedFile {
  return {
    id: String(row.id),
    name: String(row.name),
    mimeType: String(row.mime_type),
    byteSize: Number(row.byte_size),
    storagePath: String(row.storage_path),
    url: row.url ? String(row.url) : null,
    extractedText: row.extracted_text ? String(row.extracted_text) : null,
    createdAt: String(row.created_at),
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  const attachments = Array.isArray(row.chat_files)
    ? row.chat_files
        .map((chatFile) => {
          const file = (chatFile as { files?: Record<string, unknown> }).files;
          return file ? mapFile(file) : null;
        })
        .filter(Boolean) as UploadedFile[]
    : [];

  return {
    id: String(row.id),
    chatId: String(row.chat_id),
    role: row.role as Message["role"],
    content: String(row.content),
    createdAt: String(row.created_at),
    attachments,
  };
}

async function assertChatOwnership(chatId: string, userId: string) {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Chat not found");
  }
}

function normalizeFileIds(fileIds: string[] | undefined) {
  return [...new Set(fileIds ?? [])];
}

async function listOwnedFiles(fileIds: string[], userId: string) {
  if (!fileIds.length) {
    return [];
  }

  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("files")
    .select(FILE_SELECT)
    .eq("user_id", userId)
    .in("id", fileIds);

  if (error) {
    throw error;
  }

  const files = (data ?? []).map(mapFile);

  if (files.length !== fileIds.length) {
    throw new Error(FILE_ACCESS_ERROR);
  }

  const filesById = new Map(files.map((file) => [file.id, file]));

  return fileIds.map((fileId) => {
    const file = filesById.get(fileId);

    if (!file) {
      throw new Error(FILE_ACCESS_ERROR);
    }

    return file;
  });
}

export async function listMessages(chatId: string, userId: string) {
  await assertChatOwnership(chatId, userId);
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("messages")
    .select(
      "id, chat_id, role, content, created_at, chat_files(files(id, name, mime_type, byte_size, storage_path, url, extracted_text, created_at))",
    )
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMessage);
}

export async function createMessage(input: {
  chatId: string;
  userId: string;
  role: Message["role"];
  content: string;
  fileIds?: string[];
}) {
  const fileIds = normalizeFileIds(input.fileIds);

  await assertChatOwnership(input.chatId, input.userId);
  await listOwnedFiles(fileIds, input.userId);
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin
    .from("messages")
    .insert({
      chat_id: input.chatId,
      role: input.role,
      content: input.content,
    })
    .select("id, chat_id, role, content, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (fileIds.length) {
    const { error: linkError } = await admin.from("chat_files").insert(
      fileIds.map((fileId) => ({
        chat_id: input.chatId,
        message_id: data.id,
        file_id: fileId,
      })),
    );

    if (linkError) {
      throw linkError;
    }
  }

  return mapMessage({ ...data, chat_files: [] });
}

export async function getFilesForChat(fileIds: string[], userId: string) {
  return listOwnedFiles(normalizeFileIds(fileIds), userId);
}
