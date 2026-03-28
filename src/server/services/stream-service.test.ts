import { describe, expect, it } from "vitest";
import {
  sanitizeAssistantContent,
  sanitizeAssistantStream,
} from "@/server/services/stream-service";

async function collectChunks(stream: AsyncIterable<string>) {
  const chunks: string[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

describe("sanitizeAssistantContent", () => {
  it("removes leading newlines from assistant content", () => {
    expect(sanitizeAssistantContent("\n\nHello")).toBe("Hello");
    expect(sanitizeAssistantContent("\r\nHello")).toBe("Hello");
  });

  it("preserves non-leading whitespace and content", () => {
    expect(sanitizeAssistantContent("Hello\nWorld")).toBe("Hello\nWorld");
    expect(sanitizeAssistantContent("  Hello")).toBe("  Hello");
  });
});

describe("sanitizeAssistantStream", () => {
  it("drops leading newline-only chunks and trims the first content chunk", async () => {
    async function* source() {
      yield "\n";
      yield "\nHello";
      yield "\nWorld";
    }

    await expect(collectChunks(sanitizeAssistantStream(source()))).resolves.toEqual([
      "Hello",
      "\nWorld",
    ]);
  });
});
