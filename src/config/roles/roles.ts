export const ROLES = {
  SUPER_ADMIN: "super_admin",
  AGENCY_ADMIN: "agency_admin",
  MANAGER: "manager",
  COUNSELLOR: "counsellor",
  LEAD_MANAGER: "lead_manager",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleKey, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.AGENCY_ADMIN]: "Agency Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.COUNSELLOR]: "Counsellor",
  [ROLES.LEAD_MANAGER]: "Lead Manager",
};

