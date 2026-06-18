"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const TAG_COLORS = ["#8B5CF6", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#6B7280"];

export function TagFormModal({
  open,
  title,
  name,
  description,
  color,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onClose,
  onSubmit,
  submitLabel = "Save",
}: {
  open: boolean;
  title: string;
  name: string;
  description: string;
  color: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Input placeholder="Tag Name" value={name} onChange={(e) => onNameChange(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
          <div className="flex gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={["h-8 w-8 rounded-full border-2", color === c ? "border-foreground" : "border-transparent"].join(" ")}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </div>
      </div>
    </div>
  );
}
