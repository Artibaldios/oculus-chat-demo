"use client";

import type {
  AuthUser,
  ChatReplyRequest,
  ChatReplyResponse,
  Chat,
  Message,
  UploadedFile,
} from "@/types/chat";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchMe() {
  return readJson<{ user: AuthUser | null }>(await fetch("/api/auth/me"));
}

export async function login(payload: { email: string; password: string }) {
  return readJson<{ user: AuthUser | null }>(
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function register(payload: { email: string; password: string }) {
  return readJson<{
    user: AuthUser | null;
    needsEmailConfirmation: boolean;
  }>(
    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function logout() {
  return readJson<{ success: true }>(
    await fetch("/api/auth/logout", { method: "POST" }),
  );
}

export async function fetchChats() {
  return readJson<{ chats: Chat[] }>(await fetch("/api/chats"));
}

export async function createChat(payload?: { firstMessage?: string }) {
  return readJson<{ chat: Chat }>(
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    }),
  );
}

export async function deleteChat(chatId: string) {
  return readJson<{ success: true }>(
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" }),
  );
}

export async function fetchMessages(chatId: string) {
  return readJson<{ messages: Message[] }>(
    await fetch(`/api/chats/${chatId}/messages`),
  );
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return readJson<{ file: UploadedFile }>(
    await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    }),
  );
}

type RequestChatReplyOptions = {
  onChunk?: (content: string, delta: string) => void;
};

export async function requestChatReply(
  payload: ChatReplyRequest,
  options?: RequestChatReplyOptions,
): Promise<ChatReplyResponse> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = text || "Request failed";

    try {
      const payload = JSON.parse(text) as { error?: string };
      errorMessage = payload.error ?? errorMessage;
    } catch {
      // Fall back to the raw response body when the error is not JSON.
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: ChatReplyResponse | null = null;

  const flushEvent = (rawEvent: string) => {
    const lines = rawEvent.split("\n");
    const event = lines
      .filter((line) => line.startsWith("event:"))
      .map((line) => line.slice("event:".length).trim())[0];
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart())
      .join("\n");

    if (!event || !data) {
      return;
    }

    const parsed = JSON.parse(data) as
      | { delta: string; content: string }
      | { message: Message }
      | { error: string };

    if (event === "chunk" && "content" in parsed && "delta" in parsed) {
      options?.onChunk?.(parsed.content, parsed.delta);
      return;
    }

    if (event === "done" && "message" in parsed) {
      finalPayload = { message: parsed.message };
      return;
    }

    if (event === "error" && "error" in parsed) {
      throw new Error(parsed.error);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, "");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      flushEvent(rawEvent);
      boundary = buffer.indexOf("\n\n");
    }

    if (done) {
      break;
    }
  }

  if (!finalPayload) {
    throw new Error("Stream finished before a final assistant message was received");
  }

  return finalPayload;
}
