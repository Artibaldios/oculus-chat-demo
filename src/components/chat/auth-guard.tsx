import Link from "next/link";
import { LockIcon } from "lucide-react";

export function AuthGuard({ remainingMessages }: { remainingMessages: number }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl rounded-[22px] border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="flex items-center gap-3">
        <LockIcon className="size-4 shrink-0" />
        <p className="flex-1">
          Anonymous mode has {remainingMessages} free message
          {remainingMessages === 1 ? "" : "s"} left. Sign in to save chats, upload
          files, and keep going.
        </p>
        <Link
          href="/auth"
          className="rounded-full bg-amber-950 px-3 py-2 text-xs font-medium text-white"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
