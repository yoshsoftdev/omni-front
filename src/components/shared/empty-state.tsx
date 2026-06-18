import { cn } from "@/lib/utils";

export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed p-10 text-center", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
