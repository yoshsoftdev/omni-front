"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RightDrawer({
  open,
  onClose,
  children,
  footer,
  widthClass = "max-w-[420px]",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col border-l bg-card shadow-xl",
          widthClass,
          className,
        )}
      >
        {children}
        {footer ? <div className="border-t p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function RightDrawerHeader({
  children,
  onClose,
  showClose = true,
}: {
  children: ReactNode;
  onClose?: () => void;
  showClose?: boolean;
}) {
  return (
    <div className="border-b p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        {showClose && onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function RightDrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto p-5", className)}>{children}</div>;
}

export function RightDrawerTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ value: string; label: string }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4 flex gap-4 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "pb-2 text-sm capitalize",
            active === tab.value ? "border-b-2 border-primary font-medium" : "text-muted-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
