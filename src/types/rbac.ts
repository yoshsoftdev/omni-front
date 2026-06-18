export interface RoleInfo {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

export interface PermissionInfo {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface PermissionMatrixRow {
  permission: PermissionInfo;
  roles: Record<string, boolean>;
}

export interface RoleDetail {
  role: RoleInfo;
  permissions: PermissionInfo[];
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  owner_id: string;
  created_at: string;
}
