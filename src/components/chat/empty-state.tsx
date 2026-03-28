import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="space-y-2">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#2f2f2f]">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-[#6f6f77]">
          {description}
        </p>
      </div>
    </div>
  );
}
