import type { TeamRole } from "@/types/team";

const ASSIGNABLE_ROLES: TeamRole[] = ["admin", "supervisor", "agent"];

export function RoleSelector({
  value,
  onChange,
  includeOwner = false,
  disabled,
}: {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  includeOwner?: boolean;
  disabled?: boolean;
}) {
  const roles: TeamRole[] = includeOwner ? ["owner", ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;

  return (
    <select
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TeamRole)}
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
