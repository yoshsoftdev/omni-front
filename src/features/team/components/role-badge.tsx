import { cn } from "@/lib/utils";
import type { TeamRole } from "@/types/team";

const ROLE_STYLES: Record<TeamRole, string> = {
  owner: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  supervisor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  agent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
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
