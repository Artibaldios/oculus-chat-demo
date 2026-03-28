"use client";

import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/chat/file-uploader";
import { LoadingIndicator } from "@/components/chat/loading-indicator";
import type { UploadedFile } from "@/types/chat";

export function MessageInput({
  disabled,
  canUpload,
  pendingFiles,
  onSubmit,
  onFilesSelected,
}: {
  disabled?: boolean;
  canUpload: boolean;
  pendingFiles: UploadedFile[];
  onSubmit: (content: string) => Promise<void>;
  onFilesSelected: (files: FileList) => void;
}) {
  const [value, setValue] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function submitValue() {
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit(nextValue);
      setValue("");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-black/8 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
      <div className="space-y-3">
        <Textarea
          value={value}
          disabled={disabled || isPending}
          placeholder="Ask something, upload a file, or continue the conversation..."
          className="min-h-12 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submitValue();
            }
          }}
        />
        <div className="flex gap-3 border-t border-black/6 pt-3 justify-between items-center">
          <div className="space-y-2 md:max-w-[70%]">
            <FileUploader
              disabled={!canUpload || disabled || isPending}
              files={pendingFiles}
              onFilesSelected={onFilesSelected}
            />
          </div>
          <div className="flex items-center gap-3 self-end">
            {isPending && <LoadingIndicator label="Sending..." />}
            <Button
              type="button"
              disabled={disabled || isPending || !value.trim()}
              className="h-10 rounded-full px-4"
              onClick={() => void submitValue()}
            >
              Send
              <ArrowUpIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
