import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownMessage } from "@/components/chat/markdown-message";

describe("MarkdownMessage", () => {
  it("renders headings, emphasis, and lists as elements", () => {
    render(
      <MarkdownMessage
        content={`## Summary

This has **bold** and *italic* text.

- First item
- Second item

1. Step one
2. Step two`}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Summary" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bold")).toContainHTML("strong");
    expect(screen.getByText("italic")).toContainHTML("em");
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("renders fenced code blocks and safe links", () => {
    render(
      <MarkdownMessage
        content={`Use [OpenAI](https://openai.com)

\`\`\`ts
const value = "hello";
\`\`\``}
      />,
    );

    expect(screen.getByRole("link", { name: "OpenAI" })).toHaveAttribute(
      "href",
      "https://openai.com",
    );
    expect(screen.getByText('const value = "hello";')).toBeInTheDocument();
  });

  it("keeps plain text and line breaks readable", () => {
    const { container } = render(
      <MarkdownMessage content={`First line\nSecond line without markdown`} />,
    );

    expect(container.querySelector("br")).not.toBeNull();
    expect(screen.getByText(/First line/)).toBeInTheDocument();
    expect(screen.getByText(/Second line without markdown/)).toBeInTheDocument();
  });
});
