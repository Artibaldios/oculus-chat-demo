export type MessageRole = "user" | "assistant" | "system";

export type UploadedFile = {
  id: string;
  name: string;
  mimeType: string;
  byteSize: number;
  storagePath: string;
  url: string | null;
  extractedText: string | null;
  createdAt: string;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: UploadedFile[];
};

export type AuthUser = {
  id: string;
  email: string;
};

export type ChatReplyRequest = {
  chatId: string;
  content: string;
  fileIds?: string[];
  history?: Array<Pick<Message, "role" | "content">>;
};

export type ChatReplyResponse = {
  message: Message;
};
