import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Loading placeholder shaped like the content it replaces. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
