import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAnonymousChat } from "@/hooks/use-anonymous-chat";

describe("useAnonymousChat", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("tracks the 3-message anonymous cap", () => {
    const { result } = renderHook(() => useAnonymousChat());

    act(() => {
      result.current.appendConversation("One", "Reply one");
      result.current.appendConversation("Two", "Reply two");
      result.current.appendConversation("Three", "Reply three");
    });

    expect(result.current.remainingMessages).toBe(0);
    expect(result.current.canSend).toBe(false);
    expect(result.current.messages).toHaveLength(6);
  });
});
