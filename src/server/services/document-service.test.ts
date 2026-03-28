import { describe, expect, it } from "vitest";
import { trimDocumentContext } from "@/server/services/document-service";

describe("trimDocumentContext", () => {
  it("returns null for empty values", () => {
    expect(trimDocumentContext(null)).toBeNull();
  });

  it("trims large text safely", () => {
    const input = `  ${"a".repeat(13_000)}  `;
    expect(trimDocumentContext(input)).toHaveLength(12_000);
  });
});
