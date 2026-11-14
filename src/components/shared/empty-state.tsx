import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed p-10 text-center", className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** A failed load — never show it as "no data", or users think their data is gone. */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border border-error-border bg-error-muted p-10 text-center", className)}
    >
      <p className="text-sm text-error-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
