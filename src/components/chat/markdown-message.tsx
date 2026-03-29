"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

function findClosingToken(source: string, token: string, start: number) {
  const index = source.indexOf(token, start);
  return index >= 0 ? index : -1;
}

function renderInlineMarkdown(content: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let index = 0;
  let textStart = 0;

  const pushText = (end: number) => {
    if (end > textStart) {
      nodes.push(content.slice(textStart, end));
    }
  };

  while (index < content.length) {
    const doubleToken = content.slice(index, index + 2);

    if (doubleToken === "**" || doubleToken === "__") {
      const closingIndex = findClosingToken(content, doubleToken, index + 2);

      if (closingIndex > index + 2) {
        pushText(index);

        nodes.push(
          <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold">
            {renderInlineMarkdown(
              content.slice(index + 2, closingIndex),
              `${keyPrefix}-strong-${index}`,
            )}
          </strong>,
        );

        index = closingIndex + 2;
        textStart = index;
        continue;
      }
    }

    const singleChar = content[index];

    if (singleChar === "*" || singleChar === "_") {
      const closingIndex = findClosingToken(content, singleChar, index + 1);

      if (closingIndex > index + 1) {
        pushText(index);

        nodes.push(
          <em key={`${keyPrefix}-em-${index}`} className="italic">
            {renderInlineMarkdown(
              content.slice(index + 1, closingIndex),
              `${keyPrefix}-em-${index}`,
            )}
          </em>,
        );

        index = closingIndex + 1;
        textStart = index;
        continue;
      }
    }

    if (singleChar === "`") {
      const closingIndex = findClosingToken(content, "`", index + 1);

      if (closingIndex > index + 1) {
        pushText(index);

        nodes.push(
          <code
            key={`${keyPrefix}-code-${index}`}
            className="rounded bg-black/6 px-1 py-0.5 font-mono text-[0.95em]"
          >
            {content.slice(index + 1, closingIndex)}
          </code>,
        );

        index = closingIndex + 1;
        textStart = index;
        continue;
      }
    }

    if (singleChar === "[") {
      const labelEnd = content.indexOf("]", index + 1);
      const linkStart = labelEnd >= 0 ? content.indexOf("(", labelEnd + 1) : -1;
      const linkEnd = linkStart >= 0 ? content.indexOf(")", linkStart + 1) : -1;

      if (labelEnd > index + 1 && linkStart === labelEnd + 1 && linkEnd > linkStart + 1) {
        const href = content.slice(linkStart + 1, linkEnd).trim();

        if (/^https?:\/\//i.test(href)) {
          pushText(index);

          nodes.push(
            <a
              key={`${keyPrefix}-link-${index}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              {renderInlineMarkdown(content.slice(index + 1, labelEnd), `${keyPrefix}-link-${index}`)}
            </a>,
          );

          index = linkEnd + 1;
          textStart = index;
          continue;
        }
      }
    }

    index += 1;
  }

  pushText(content.length);
  return nodes;
}

function renderParagraph(lines: string[], key: string) {
  return (
    <p key={key}>
      {lines.map((line, index) => (
        <Fragment key={`${key}-line-${index}`}>
          {index > 0 ? <br /> : null}
          {renderInlineMarkdown(line, `${key}-line-${index}`)}
        </Fragment>
      ))}
    </p>
  );
}

export function MarkdownMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      const language = trimmed.slice(3).trim();
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <pre
          key={`code-${blocks.length}`}
          className="overflow-x-auto rounded-2xl bg-[#1f2937] px-4 py-3 text-xs leading-6 text-white"
        >
          {language ? <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">{language}</div> : null}
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );

      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="border-l-2 border-black/15 pl-4 text-[#4b5563]"
        >
          {renderParagraph(quoteLines, `quote-${blocks.length}`)}
        </blockquote>,
      );

      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ul-${blocks.length}-item-${itemIndex}`}>
              {renderInlineMarkdown(item, `ul-${blocks.length}-item-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );

      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${blocks.length}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ol-${blocks.length}-item-${itemIndex}`}>
              {renderInlineMarkdown(item, `ol-${blocks.length}-item-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );

      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const Heading = `h${level}` as HeadingTag;
      const headingClasses = {
        1: "text-xl font-semibold",
        2: "text-lg font-semibold",
        3: "text-base font-semibold",
        4: "text-sm font-semibold",
        5: "text-sm font-medium",
        6: "text-sm font-medium uppercase tracking-wide text-[#5f5f67]",
      };

      blocks.push(
        <Heading
          key={`heading-${blocks.length}`}
          className={headingClasses[level as keyof typeof headingClasses]}
        >
          {renderInlineMarkdown(headingMatch[2], `heading-${blocks.length}`)}
        </Heading>,
      );

      index += 1;
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length) {
      const nextTrimmed = lines[index].trim();

      if (
        !nextTrimmed ||
        nextTrimmed.startsWith("```") ||
        /^>\s?/.test(nextTrimmed) ||
        /^[-*+]\s+/.test(nextTrimmed) ||
        /^\d+\.\s+/.test(nextTrimmed) ||
        /^(#{1,6})\s+/.test(nextTrimmed)
      ) {
        break;
      }

      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(renderParagraph(paragraphLines, `paragraph-${blocks.length}`));
  }

  return (
    <div
      className={cn(
        "space-y-3 wrap-break-word [&_a]:text-inherit [&_code]:wrap-break-word [&_li]:leading-6 [&_p]:leading-6",
        className,
      )}
    >
      {blocks}
    </div>
  );
}
