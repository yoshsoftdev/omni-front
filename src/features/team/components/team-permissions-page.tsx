"use client";

import { useEffect, useState } from "react";

import { PermissionMatrix } from "@/features/team/components/permission-matrix";
import { TeamNav } from "@/features/team/components/team-nav";
import { teamService } from "@/features/team/services/team.service";
import type { PermissionMatrixRow } from "@/types/rbac";

export function TeamPermissionsPage() {
  const [matrix, setMatrix] = useState<PermissionMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService
      .getPermissionMatrix()
      .then(setMatrix)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permission Matrix</h1>
        <p className="text-muted-foreground">
          Review role capabilities. Matrix data loads from the API when available.
        </p>
      </div>

      <TeamNav />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading permissions...</p>
      ) : matrix.length === 0 ? (
        <p className="text-sm text-muted-foreground">No permission matrix data available yet.</p>
      ) : (
        <PermissionMatrix rows={matrix} editable />
      )}
    </div>
  );
}
