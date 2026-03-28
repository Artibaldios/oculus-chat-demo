import "server-only";
import { STORAGE_BUCKET } from "@/lib/constants";
import { env } from "@/lib/env";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UploadedFile } from "@/types/chat";
import type {
  CompletionInput,
  LLMProvider,
} from "@/server/services/llm/types";

type ZenMuxMessage = {
  role: "system" | "user" | "assistant";
  content: string | ZenMuxContentPart[];
};

type ZenMuxContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

// This is ZenMux provider that was used for testing and deploy

function getZenMuxBaseUrl() {
  return (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
}

const RATE_LIMIT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_AFTER_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value: string | null) {
  if (!value) {
    return DEFAULT_RETRY_AFTER_MS;
  }

  const seconds = Number(value);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(dateMs - Date.now(), DEFAULT_RETRY_AFTER_MS);
  }

  return DEFAULT_RETRY_AFTER_MS;
}

async function readProviderError(response: Response) {
  const rawText = await response.text();

  if (!rawText) {
    return response.status === 429
      ? "The AI provider is rate-limiting requests right now. Please wait a moment and try again."
      : "ZenMux request failed";
  }

  try {
    const payload = JSON.parse(rawText) as unknown;

    if (payload && typeof payload === "object") {
      if ("error" in payload) {
        const error = payload.error;

        if (typeof error === "string") {
          return error;
        }

        if (error && typeof error === "object" && "message" in error) {
          const message = error.message;
          if (typeof message === "string" && message) {
            return message;
          }
        }
      }

      if ("message" in payload) {
        const message = payload.message;
        if (typeof message === "string" && message) {
          return message;
        }
      }
    }
  } catch {
    // Fall back to raw text when the provider response is not valid JSON.
  }

  return rawText;
}

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

async function buildMessages(input: CompletionInput): Promise<ZenMuxMessage[]> {
  const history: ZenMuxMessage[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const content: ZenMuxContentPart[] = [];

  if (input.prompt) {
    content.push({
      type: "text",
      text: input.prompt,
    });
  }

  const documentContext = input.files
    .filter((file) => !file.mimeType.startsWith("image/") && file.extractedText)
    .map((file) => `Document: ${file.name}\n${file.extractedText}`)
    .join("\n\n");

  if (documentContext) {
    content.push({
      type: "text",
      text: `Attached document context:\n${documentContext}`,
    });
  }

  const imageFiles = input.files.filter((file) => file.mimeType.startsWith("image/"));
  const imageUrls = await Promise.all(imageFiles.map((file) => toSignedImageUrl(file)));

  for (const url of imageUrls) {
    content.push({
      type: "image_url",
      image_url: { url },
    });
  }

  history.push({
    role: "user",
    content,
  });

  return history;
}

function extractDelta(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "type" in payload &&
    payload.type === "response.output_text.delta" &&
    "delta" in payload &&
    typeof payload.delta === "string"
  ) {
    return payload.delta;
  }

  if (!payload || typeof payload !== "object" || !("choices" in payload)) {
    return "";
  }

  const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  const delta = firstChoice && typeof firstChoice === "object" ? firstChoice.delta : null;

  if (!delta || typeof delta !== "object" || !("content" in delta)) {
    return "";
  }

  if (typeof delta.content === "string") {
    return delta.content;
  }

  if (!Array.isArray(delta.content)) {
    return "";
  }

  return delta.content
    .map((part: unknown) => {
      if (typeof part === "string") {
        return part;
      }

      if (!part || typeof part !== "object") {
        return "";
      }

      if ("text" in part && typeof part.text === "string") {
        return part.text;
      }

      return "";
    })
    .join("");
}

async function* readChatCompletionStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, "");

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const data = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trimStart())
        .join("\n");

      if (data === "[DONE]") {
        return;
      }

      if (data) {
        const payload = JSON.parse(data) as unknown;
        const delta = extractDelta(payload);

        if (delta) {
          yield delta;
        }
      }

      boundary = buffer.indexOf("\n\n");
    }

    if (done) {
      break;
    }
  }
}

export class ZenMuxProvider implements LLMProvider {
  async complete(input: CompletionInput) {
    let content = "";

    for await (const chunk of this.stream(input)) {
      content += chunk;
    }

    return content;
  }

  async *stream(input: CompletionInput) {
    const messages = await buildMessages(input);
    let response: Response | null = null;

    for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_ATTEMPTS; attempt += 1) {
      response = await fetch(`${getZenMuxBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.AiApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.AiModel(),
          messages,
          stream: true,
        }),
      });

      if (response.ok) {
        break;
      }

      if (response.status !== 429 || attempt === RATE_LIMIT_RETRY_ATTEMPTS) {
        break;
      }

      await sleep(parseRetryAfterMs(response.headers.get("Retry-After")));
    }

    if (!response) {
      throw new Error("ZenMux request failed");
    }

    if (!response.ok) {
      throw new Error(await readProviderError(response));
    }

    if (!response.body) {
      throw new Error("ZenMux did not return a response stream");
    }

    yield* readChatCompletionStream(response.body);
  }
}
