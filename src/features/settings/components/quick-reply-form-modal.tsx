"use client";

import { X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QUICK_REPLY_VARIABLES } from "@/features/settings/types/quick-reply";

const VARIABLE_LABELS: Record<(typeof QUICK_REPLY_VARIABLES)[number], string> = {
  "{{customer_name}}": "Customer name",
  "{{agent_name}}": "Agent name",
  "{{company_name}}": "Company name",
  "{{phone}}": "Phone",
  "{{today}}": "Today",
};

function insertAtCursor(value: string, token: string, selectionStart: number, selectionEnd: number) {
  const next = `${value.slice(0, selectionStart)}${token}${value.slice(selectionEnd)}`;
  const nextCursor = selectionStart + token.length;
  return { next, nextCursor };
}

export function QuickReplyFormModal({
  open,
  title,
  category,
  content,
  onCategoryChange,
  onContentChange,
  onClose,
  onSubmit,
  submitLabel = "Save",
}: {
  open: boolean;
  title: string;
  category: string;
  content: string;
  onCategoryChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(token: string) {
    const textarea = contentRef.current;
    if (!textarea) {
      onContentChange(content ? `${content}${token}` : token);
      return;
    }
    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const { next, nextCursor } = insertAtCursor(content, token, start, end);
    onContentChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          />
          <textarea
            ref={contentRef}
            placeholder="Quick reply content"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Insert variable</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLY_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => insertVariable(variable)}
                >
                  {VARIABLE_LABELS[variable]}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </div>
      </div>
    </div>
  );
}
