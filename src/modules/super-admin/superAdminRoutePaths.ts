export const superAdminRoutePaths = {
  overview: "/super-admin",
  agencies: "/super-admin/agencies",
  createAgency: "/super-admin/agencies/create",
  agencyDetail: (agencyId: string) => `/super-admin/agencies/${agencyId}`,
  analytics: "/super-admin/analytics",
  roleTemplates: "/super-admin/role-templates",
  globalSettings: "/super-admin/settings",
} as const;
