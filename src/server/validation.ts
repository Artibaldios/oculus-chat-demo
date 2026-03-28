import { z } from "zod";

export const authSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const createChatSchema = z.object({
  firstMessage: z.string().trim().min(1).max(4000).optional(),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  fileIds: z.array(z.uuid()).max(5).optional().default([]),
});

export const chatReplySchema = z.object({
  chatId: z.string().min(1),
  content: z.string().trim().min(1).max(4000),
  fileIds: z.array(z.uuid()).max(5).optional().default([]),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});
