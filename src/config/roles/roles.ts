export const ROLES = {
  SUPER_ADMIN: "super_admin",
  AGENCY_ADMIN: "agency_admin",
  COUNSELLOR: "counsellor",
  APPLICATION_MANAGER: "application_manager",
  ACTIVITY_MANAGER: "activity_manager",
  ANALYST: "analyst",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleKey, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.AGENCY_ADMIN]: "Agency Admin",
  [ROLES.COUNSELLOR]: "Counsellor",
  [ROLES.APPLICATION_MANAGER]: "Application Manager",
  [ROLES.ACTIVITY_MANAGER]: "Activity Manager",
  [ROLES.ANALYST]: "Analyst",
};

