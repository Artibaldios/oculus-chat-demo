"use client";

import { useRef } from "react";
import { PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UploadedFile } from "@/types/chat";

export function FileUploader({
  disabled,
  files,
  onFilesSelected,
}: {
  disabled?: boolean;
  files: UploadedFile[];
  onFilesSelected: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<span className="inline-flex" />}
        >
          <div className="flex items-center gap-2 relative">
            <input
              ref={inputRef}
              hidden
              multiple
              type="file"
              accept="image/png,image/jpeg,image/webp,text/plain,application/pdf"
              onChange={(event) => {
                if (event.target.files?.length) {
                  onFilesSelected(event.target.files);
                }
                event.currentTarget.value = "";
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="rounded-full"
              onClick={() => inputRef.current?.click()}
            >
              <PaperclipIcon className="size-4" />
              <span className="sr-only">Attach files</span>
            </Button>

            {!!files.length && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {files.map((file) => (
                  <span
                    key={file.id}
                    className="rounded-full bg-muted px-2 py-1 text-foreground"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{disabled ? "Sign in to attach files": "Attach Files"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
