export const settingsRoutePaths = {
  team: "/settings/team",
  addUser: "/settings/team/create",
  roles: "/settings/roles",
  createRole: "/settings/roles/create",
  editRole: (roleId: string) => `/settings/roles/${roleId}/edit`,
} as const;
