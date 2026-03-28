import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminSupabaseClient } = vi.hoisted(() => ({
  getAdminSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminSupabaseClient,
}));

import { createMessage, getFilesForChat } from "@/server/services/message-service";

function createChatQuery() {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { id: "chat-1" },
    error: null,
  });
  const secondEq = vi.fn(() => ({ maybeSingle }));
  const firstEq = vi.fn(() => ({ eq: secondEq }));
  const select = vi.fn(() => ({ eq: firstEq }));

  return {
    query: { select },
    maybeSingle,
  };
}

function createFilesQuery(rows: Array<Record<string, unknown>>) {
  const inQuery = vi.fn().mockResolvedValue({
    data: rows,
    error: null,
  });
  const eq = vi.fn(() => ({ in: inQuery }));
  const select = vi.fn(() => ({ eq }));

  return {
    query: { select },
    inQuery,
  };
}

function createMessagesInsertQuery() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: "message-1",
      chat_id: "chat-1",
      role: "user",
      content: "Hello",
      created_at: "2026-03-28T00:00:00.000Z",
    },
    error: null,
  });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));

  return {
    query: { insert },
    insert,
  };
}

function createChatFilesInsertQuery() {
  const insert = vi.fn().mockResolvedValue({ error: null });

  return {
    query: { insert },
    insert,
  };
}

function setAdminClient(options: {
  fileRows?: Array<Record<string, unknown>>;
}) {
  const chatQuery = createChatQuery();
  const filesQuery = createFilesQuery(options.fileRows ?? []);
  const messagesQuery = createMessagesInsertQuery();
  const chatFilesQuery = createChatFilesInsertQuery();

  getAdminSupabaseClient.mockReturnValue({
    from(table: string) {
      if (table === "chats") {
        return chatQuery.query;
      }

      if (table === "files") {
        return filesQuery.query;
      }

      if (table === "messages") {
        return messagesQuery.query;
      }

      if (table === "chat_files") {
        return chatFilesQuery.query;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  });

  return {
    filesInQuery: filesQuery.inQuery,
    messagesInsert: messagesQuery.insert,
    chatFilesInsert: chatFilesQuery.insert,
  };
}

describe("message-service attachment authorization", () => {
  beforeEach(() => {
    getAdminSupabaseClient.mockReset();
  });

  it("rejects linking files that are not fully owned by the current user", async () => {
    const admin = setAdminClient({
      fileRows: [
        {
          id: "file-1",
          name: "doc.txt",
          mime_type: "text/plain",
          byte_size: 10,
          storage_path: "user-1/doc.txt",
          url: null,
          extracted_text: "hello",
          created_at: "2026-03-28T00:00:00.000Z",
        },
      ],
    });

    await expect(
      createMessage({
        chatId: "chat-1",
        userId: "user-1",
        role: "user",
        content: "Hello",
        fileIds: ["file-1", "file-2"],
      }),
    ).rejects.toThrow("One or more files are unavailable for this user");

    expect(admin.messagesInsert).not.toHaveBeenCalled();
    expect(admin.chatFilesInsert).not.toHaveBeenCalled();
  });

  it("deduplicates file ids and preserves the requested order for owned files", async () => {
    setAdminClient({
      fileRows: [
        {
          id: "file-2",
          name: "second.txt",
          mime_type: "text/plain",
          byte_size: 10,
          storage_path: "user-1/second.txt",
          url: null,
          extracted_text: "second",
          created_at: "2026-03-28T00:00:00.000Z",
        },
        {
          id: "file-1",
          name: "first.txt",
          mime_type: "text/plain",
          byte_size: 10,
          storage_path: "user-1/first.txt",
          url: null,
          extracted_text: "first",
          created_at: "2026-03-28T00:00:00.000Z",
        },
      ],
    });

    await expect(
      getFilesForChat(["file-1", "file-2", "file-1"], "user-1"),
    ).resolves.toMatchObject([
      { id: "file-1", name: "first.txt" },
      { id: "file-2", name: "second.txt" },
    ]);
  });
});
