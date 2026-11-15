"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input aria-label="Tag name" placeholder="Tag Name" value={name} onChange={(e) => onNameChange(e.target.value)} />
          <Input aria-label="Description" placeholder="Description" value={description} onChange={(e) => onDescriptionChange(e.target.value)} />
          <div className="flex gap-2" role="radiogroup" aria-label="Tag color">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Color ${c}`}
                className={["h-8 w-8 rounded-full border-2", color === c ? "border-foreground" : "border-transparent"].join(" ")}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
