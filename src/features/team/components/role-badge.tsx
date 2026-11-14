import { cn } from "@/lib/utils";
import type { TeamRole } from "@/types/team";

const ROLE_STYLES: Record<TeamRole, string> = {
  owner: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  admin: "bg-info-muted text-info-foreground",
  supervisor: "bg-warning-muted text-warning-foreground",
  agent: "bg-success-muted text-success-foreground",
};

export function RoleBadge({ role, className }: { role: TeamRole | string; className?: string }) {
  const key = role as TeamRole;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        ROLE_STYLES[key] ?? ROLE_STYLES.agent,
        className,
      )}
    >
      {role}
    </span>
  );
}
