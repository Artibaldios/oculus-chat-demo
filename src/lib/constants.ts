export const MAX_ANONYMOUS_MESSAGES = 3;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const STORAGE_BUCKET = "chat-uploads";
export const DOCUMENT_CONTEXT_CHAR_LIMIT = 12_000;

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
] as const;

export const SUPPORTED_UPLOAD_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_DOCUMENT_TYPES,
] as const;
