import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  MAX_UPLOAD_BYTES,
  STORAGE_BUCKET,
  SUPPORTED_UPLOAD_TYPES,
} from "@/lib/constants";
import { extractDocumentText } from "@/server/services/document-service";
import type { UploadedFile } from "@/types/chat";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function inferMimeType(filename: string, type: string) {
  if (type) {
    return type;
  }

  const extension = filename.toLowerCase().split(".").pop();
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  if (extension === "pdf") {
    return "application/pdf";
  }
  if (extension === "txt") {
    return "text/plain";
  }

  return "";
}

function mapFile(row: Record<string, unknown>): UploadedFile {
  return {
    id: String(row.id),
    name: String(row.name),
    mimeType: String(row.mime_type),
    byteSize: Number(row.byte_size),
    storagePath: String(row.storage_path),
    url: row.url ? String(row.url) : null,
    extractedText: row.extracted_text ? String(row.extracted_text) : null,
    createdAt: String(row.created_at),
  };
}

export async function uploadFileForUser(userId: string, file: File) {
  const mimeType = inferMimeType(file.name, file.type);

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 5MB limit");
  }

  if (
    !SUPPORTED_UPLOAD_TYPES.includes(
      mimeType as (typeof SUPPORTED_UPLOAD_TYPES)[number],
    )
  ) {
    throw new Error("Unsupported file type");
  }

  const admin = getAdminSupabaseClient();
  const storagePath = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();
  const normalizedFile = new File([Buffer.from(arrayBuffer)], file.name, {
    type: mimeType,
  });

  let extractedText: string | null = null;
  try {
    extractedText = await extractDocumentText(normalizedFile);
  } catch (error) {
    console.warn("Document text extraction failed", {
      fileName: file.name,
      mimeType,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await admin
    .from("files")
    .insert({
      user_id: userId,
      name: file.name,
      mime_type: mimeType,
      byte_size: file.size,
      storage_path: storagePath,
      url: null,
      extracted_text: extractedText,
    })
    .select("id, name, mime_type, byte_size, storage_path, url, extracted_text, created_at")
    .single();

  if (error) {
    throw error;
  }

  const mapped = mapFile(data);
  if (!mimeType.startsWith("image/")) {
    return mapped;
  }

  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (signedUrlError) {
    return mapped;
  }

  return {
    ...mapped,
    url: signedUrlData.signedUrl,
  };
}
