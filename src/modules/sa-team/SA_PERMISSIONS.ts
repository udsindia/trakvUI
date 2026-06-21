export const SA_PERMISSIONS = {
  DASHBOARD_VIEW: "SA_DASHBOARD_VIEW",
  TENANTS_VIEW: "SA_TENANTS_VIEW",
  TENANTS_APPROVE: "SA_TENANTS_APPROVE",
  TENANTS_SUSPEND: "SA_TENANTS_SUSPEND",
  TENANTS_ONBOARD: "SA_TENANTS_ONBOARD",
  PLAN_MANAGE: "SA_PLAN_MANAGE",
  META_CONFIG_VIEW: "SA_META_CONFIG_VIEW",
  META_CONFIG_EDIT: "SA_META_CONFIG_EDIT",
  WHATSAPP_CONFIG_VIEW: "SA_WHATSAPP_CONFIG_VIEW",
  WHATSAPP_CONFIG_EDIT: "SA_WHATSAPP_CONFIG_EDIT",
  USERS_MANAGE: "SA_USERS_MANAGE",
  ROLES_MANAGE: "SA_ROLES_MANAGE",
  IMPERSONATE: "SA_IMPERSONATE",
} as const;

export type SaPermissionCode = typeof SA_PERMISSIONS[keyof typeof SA_PERMISSIONS];

// Grouped for the permission editor UI
export const SA_PERMISSION_GROUPS: { label: string; permissions: SaPermissionCode[] }[] = [
  {
    label: "Dashboard",
    permissions: [SA_PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    label: "Tenants",
    permissions: [
      SA_PERMISSIONS.TENANTS_VIEW,
      SA_PERMISSIONS.TENANTS_APPROVE,
      SA_PERMISSIONS.TENANTS_SUSPEND,
      SA_PERMISSIONS.TENANTS_ONBOARD,
      SA_PERMISSIONS.PLAN_MANAGE,
    ],
  },
  {
    label: "Integrations",
    permissions: [
      SA_PERMISSIONS.META_CONFIG_VIEW,
      SA_PERMISSIONS.META_CONFIG_EDIT,
      SA_PERMISSIONS.WHATSAPP_CONFIG_VIEW,
      SA_PERMISSIONS.WHATSAPP_CONFIG_EDIT,
    ],
  },
  {
    label: "Administration",
    permissions: [
      SA_PERMISSIONS.USERS_MANAGE,
      SA_PERMISSIONS.ROLES_MANAGE,
      SA_PERMISSIONS.IMPERSONATE,
    ],
  },
];

export const SA_PERMISSION_LABELS: Record<SaPermissionCode, string> = {
  SA_DASHBOARD_VIEW: "View platform dashboard",
  SA_TENANTS_VIEW: "View all tenants",
  SA_TENANTS_APPROVE: "Approve / reject registrations",
  SA_TENANTS_SUSPEND: "Suspend / reactivate tenants",
  SA_TENANTS_ONBOARD: "Manually onboard tenants",
  SA_PLAN_MANAGE: "Change plans & extend trials",
  SA_META_CONFIG_VIEW: "View Meta Ads config",
  SA_META_CONFIG_EDIT: "Edit Meta Ads config",
  SA_WHATSAPP_CONFIG_VIEW: "View WhatsApp config",
  SA_WHATSAPP_CONFIG_EDIT: "Edit WhatsApp config",
  SA_USERS_MANAGE: "Manage SA team users",
  SA_ROLES_MANAGE: "Edit SA role permissions",
  SA_IMPERSONATE: "Impersonate tenant admin",
};
