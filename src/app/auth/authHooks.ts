import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  initializeAuthSession,
  login,
  logout,
  selectAuthState,
} from "@/app/auth/authSlice";
import type { AuthLoginRequest } from "@/app/auth/auth.types";
import type { PermissionKey } from "@/config/permissions/permissions";
import type { RoleKey } from "@/config/roles/roles";

export function useAuth() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector(selectAuthState);

  return {
    ...authState,
    isAuthenticated: authState.sessionStatus === "authenticated",
    isInitializing: authState.bootstrapStatus !== "ready",
    grantedPermissions: authState.permissions,
    initializeSession: async () => {
      await dispatch(initializeAuthSession()).unwrap();
    },
    login: async (request: AuthLoginRequest) => {
      return await dispatch(login(request)).unwrap();
    },
    logout: async () => {
      await dispatch(logout()).unwrap();
    },
    hasRole: (role: RoleKey) => authState.roles.includes(role),
    hasAnyRole: (roles: RoleKey[]) =>
      roles.some((role) => authState.roles.includes(role)),
    hasPermissions: (permissions: PermissionKey[]) =>
      permissions.every((permission) => authState.permissions.includes(permission)),
  };
}
