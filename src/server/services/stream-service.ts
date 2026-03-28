import "server-only";
import { touchChat } from "@/server/services/chat-service";
import {
  createMessage,
  getFilesForChat,
  listMessages,
} from "@/server/services/message-service";
import { ZenMuxProvider } from "@/server/services/llm/zenmux-provider";
import type { Message } from "@/types/chat";

const provider = new ZenMuxProvider();

type AssistantReplyStream = {
  stream: AsyncIterable<string>;
  finalize(content: string): Promise<Message>;
};

function sanitizeAssistantContent(content: string) {
  return content.replace(/^\r?\n+/, "");
}

async function* sanitizeAssistantStream(stream: AsyncIterable<string>) {
  let hasEmittedContent = false;

  for await (const chunk of stream) {
    if (hasEmittedContent) {
      yield chunk;
      continue;
    }

    const sanitizedChunk = sanitizeAssistantContent(chunk);

    if (!sanitizedChunk) {
      continue;
    }

    hasEmittedContent = true;
    yield sanitizedChunk;
  }
}

export async function createAssistantReplyStream(input: {
  chatId: string;
  userId: string;
  content: string;
  fileIds: string[];
}): Promise<AssistantReplyStream> {
  const priorMessages = await listMessages(input.chatId, input.userId);
  const files = await getFilesForChat(input.fileIds, input.userId);
  await createMessage({
    chatId: input.chatId,
    userId: input.userId,
    role: "user",
    content: input.content,
    fileIds: input.fileIds,
  });

  return {
    stream: sanitizeAssistantStream(
      provider.stream({
        prompt: input.content,
        messages: priorMessages,
        files,
      }),
    ),
    finalize: async (content) => {
      const sanitizedContent = sanitizeAssistantContent(content);
      const assistantMessage = await createMessage({
        chatId: input.chatId,
        userId: input.userId,
        role: "assistant",
        content: sanitizedContent,
      });

      await touchChat(
        input.chatId,
        input.userId,
        priorMessages.length ? undefined : input.content,
      );

      return assistantMessage;
    },
  };
}

export async function createEphemeralAssistantReplyStream(input: {
  chatId: string;
  content: string;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}): Promise<AssistantReplyStream> {
  return {
    stream: sanitizeAssistantStream(
      provider.stream({
        prompt: input.content,
        messages: input.history.map((message, index) => ({
          id: `anonymous-${index}`,
          chatId: input.chatId,
          role: message.role,
          content: message.content,
          createdAt: new Date().toISOString(),
        })),
        files: [],
      }),
    ),
    finalize: async (content) => ({
      id: crypto.randomUUID(),
      chatId: input.chatId,
      role: "assistant",
      content: sanitizeAssistantContent(content),
      createdAt: new Date().toISOString(),
    }),
  };
}

export { sanitizeAssistantContent, sanitizeAssistantStream };
