import { describe, expect, it } from "vitest";
import { deriveChatTitle } from "@/server/services/chat-title";

describe("deriveChatTitle", () => {
  it("trims whitespace and limits length", () => {
    expect(
      deriveChatTitle("   Hello    from    a long long long long long prompt   "),
    ).toBe("Hello from a long long long long long prompt");
  });

  it("falls back when content is empty", () => {
    expect(deriveChatTitle("   ")).toBe("New chat");
  });
});
