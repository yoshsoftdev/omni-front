import { cn } from "@/lib/utils";

export function TagBadge({
  name,
  color,
  className,
  size = "sm",
}: {
  name: string;
  color: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium text-white",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}

export function TagBadgeList({
  tags,
  className,
}: {
  tags: Array<{ id: string; name: string; color: string }>;
  className?: string;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <TagBadge key={tag.id} name={tag.name} color={tag.color} />
      ))}
    </div>
  );
}
