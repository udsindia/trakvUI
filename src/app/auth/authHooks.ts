import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  initializeAuthSession,
  login,
  logout,
  selectAuthState,
} from "@/app/auth/authSlice";
import type { AuthLoginRequest } from "@/app/auth/auth.types";
import { isSuperAdmin } from "@/config/roles/superAdmin";
import type { PermissionKey } from "@/config/permissions/permissions";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/shared/utils/permissions";

export function useAuth() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector(selectAuthState);
  const superAdmin = isSuperAdmin(authState.roles);

  return {
    ...authState,
    isAuthenticated: authState.sessionStatus === "authenticated",
    isInitializing: authState.bootstrapStatus !== "ready",
    isSuperAdmin: superAdmin,
    grantedPermissions: authState.permissions,
    isTrialExpired: authState.isTrialExpired,
    initializeSession: async () => {
      await dispatch(initializeAuthSession()).unwrap();
    },
    login: async (request: AuthLoginRequest) => {
      return await dispatch(login(request)).unwrap();
    },
    logout: async () => {
      await dispatch(logout()).unwrap();
    },
    hasRole: (role: string) => authState.roles.includes(role),
    hasAnyRole: (roles: string[]) =>
      roles.some((role) => authState.roles.includes(role)),
    hasPermission: (permission: string) =>
      hasPermission(authState.permissions, permission, authState.roles),
    hasPermissions: (permissions: PermissionKey[]) =>
      hasAllPermissions(authState.permissions, permissions, authState.roles),
    hasAnyPermission: (permissions: PermissionKey[]) =>
      hasAnyPermission(authState.permissions, permissions, authState.roles),
  };
}
