export function LoadingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current" />
      </span>
      <span>{label}</span>
    </div>
  );
}
