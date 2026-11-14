"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/**
 * Right-side panel for viewing/editing one record without leaving the list.
 * Built on Sheet, so focus trap, Escape and screen-reader labelling are included.
 * Nested confirmations must be a Dialog (not a hand-made overlay) or they cannot receive clicks.
 */
export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Without a description, opt out explicitly so Radix does not warn. */}
      <SheetContent {...(description ? {} : { "aria-describedby": undefined })}>
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div className="min-w-0 space-y-1">
            <SheetTitle className="truncate text-lg font-semibold">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="text-sm text-muted-foreground">{description}</SheetDescription>
            ) : null}
          </div>
          <SheetClose className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t p-4">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
