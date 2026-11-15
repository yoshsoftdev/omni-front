import { FilterSelect } from "@/components/shared/filter-bar";
import type { TeamRole } from "@/types/team";

const ASSIGNABLE_ROLES: TeamRole[] = ["admin", "supervisor", "agent"];

export function RoleSelector({
  id,
  value,
  onChange,
  includeOwner = false,
  disabled,
}: {
  /** For a visible <label htmlFor>. */
  id?: string;
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  includeOwner?: boolean;
  disabled?: boolean;
}) {
  const roles: TeamRole[] = includeOwner ? ["owner", ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;

  return (
    <FilterSelect
      id={id}
      label="Role"
      value={value}
      disabled={disabled}
      onChange={(role) => onChange(role as TeamRole)}
      options={roles.map((role) => ({ value: role, label: role }))}
      className="w-full capitalize"
    />
  );
}
