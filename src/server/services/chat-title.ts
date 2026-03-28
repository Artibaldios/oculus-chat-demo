export function deriveChatTitle(content: string) {
  return (
    content
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 60)
      .replace(/[^\p{L}\p{N}\s.,!?'"()-]/gu, "") || "New chat"
  );
}
