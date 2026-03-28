import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { STORAGE_BUCKET } from "@/lib/constants";
import { env } from "@/lib/env";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UploadedFile } from "@/types/chat";
import type {
  CompletionInput,
  LLMProvider,
} from "@/server/services/llm/types";


// This is OpenAI provider that was used for testing

async function toSignedImageUrl(file: UploadedFile) {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storagePath, 60 * 10);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function buildMessages(
  input: CompletionInput,
): Promise<ChatCompletionMessageParam[]> {
  const history: ChatCompletionMessageParam[] = input.messages.map((message) => ({
    role: message.role, // must be "system" | "user" | "assistant" | "tool" | "function"
    content: message.content,
  }));

  const userContent: string[] = [];

  if (input.prompt) {
    userContent.push(input.prompt);
  }

  const documentContext = input.files
    .filter((file) => !file.mimeType.startsWith("image/") && file.extractedText)
    .map((file) => `Document: ${file.name}\n${file.extractedText}`)
    .join("\n\n");

  if (documentContext) {
    userContent.push(`Attached document context:\n${documentContext}`);
  }

  history.push({
    role: "user",
    content: userContent.join("\n\n"),
  });

  return history;
}

export class OpenAIProvider implements LLMProvider {
  private readonly client = new OpenAI({
    apiKey: env.AiApiKey(),
    baseURL: process.env.AI_BASE_URL,
  });

  async complete(input: CompletionInput) {
    const messages = await buildMessages(input);
    const response = await this.client.chat.completions.create({
      model: env.AiModel(),
      messages,
    });
    const content = response.choices[0]?.message?.content ?? "";
    return content;
  }
}
