import type { Message, UploadedFile } from "@/types/chat";

export type CompletionInput = {
  prompt: string;
  messages: Message[];
  files: UploadedFile[];
};

export interface LLMProvider {
  complete(input: CompletionInput): Promise<string>;
  stream?(input: CompletionInput): AsyncIterable<string>;
}
