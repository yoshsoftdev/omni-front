"use client";

import { useCallback, useEffect, useState } from "react";

import { PermissionMatrix } from "@/features/team/components/permission-matrix";
import { TeamNav } from "@/features/team/components/team-nav";
import { roleCodesFromMatrix } from "@/features/team/constants/permissions";
import { teamService } from "@/features/team/services/team.service";
import { formatApiErrorMessage } from "@/services/api/errors";
import type { PermissionMatrixRow, RoleInfo } from "@/types/rbac";

export function TeamPermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrixRow[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiRoles, apiMatrix] = await Promise.all([
        teamService.listRoles(),
        teamService.getPermissionMatrix(),
      ]);
      setRoles(apiRoles);
      setMatrix(apiMatrix);
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggle(rowIndex: number, roleName: string) {
    if (roleName === "owner") return;
    const role = roles.find((item) => item.name === roleName);
    if (!role) return;
    const nextMatrix = matrix.map((row, idx) =>
      idx === rowIndex
        ? { ...row, roles: { ...row.roles, [roleName]: !row.roles[roleName] } }
        : row,
    );
    try {
      await teamService.updateRolePermissions(role.id, roleCodesFromMatrix(nextMatrix, roleName));
      setMatrix(nextMatrix);
    } catch (err) {
      setError(formatApiErrorMessage(err));
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permission Matrix</h1>
        <p className="text-muted-foreground">
          Review role capabilities. Changes are saved to the server.
        </p>
      </div>

      <TeamNav />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading permissions...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : matrix.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permission matrix data available yet.</p>
      ) : (
        <PermissionMatrix rows={matrix} editable onToggle={handleToggle} />
      )}
    </div>
  );
}
