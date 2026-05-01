import type { TenantModuleMap } from "@/config/modules/modules";
import type { PermissionKey } from "@/config/permissions/permissions";
import type { RoleKey } from "@/config/roles/roles";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email?: string;
}

export interface TenantContextState {
  tenantId: string;
  tenantName: string;
  enabledModules: TenantModuleMap;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresAt?: number;
}

export interface AuthSession {
  user: AuthenticatedUser;
  roles: RoleKey[];
  permissions: PermissionKey[];
  tenant: TenantContextState;
  tokens: AuthTokens;
}

export type AuthStrategy = "credentials" | "sso";
export type AuthBootstrapStatus = "idle" | "initializing" | "ready";
export type AuthSessionStatus = "authenticated" | "unauthenticated";

export interface CredentialsLoginRequest {
  identifier: string;
  password: string;
  strategy?: "credentials";
}

export interface SsoLoginRequest {
  provider: string;
  redirectUri: string;
  code: string;
  strategy: "sso";
}

export type AuthLoginRequest = CredentialsLoginRequest | SsoLoginRequest;

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: "Bearer";
  user: AuthenticatedUser;
  roles: RoleKey[];
  permissions: PermissionKey[];
  tenantId: string;
  tenantName?: string;
  enabledModules: Partial<TenantModuleMap>;
}

export interface AuthState {
  bootstrapStatus: AuthBootstrapStatus;
  sessionStatus: AuthSessionStatus;
  isLoggingIn: boolean;
  error: string | null;
  user: AuthenticatedUser | null;
  roles: RoleKey[];
  permissions: PermissionKey[];
  tenant: TenantContextState | null;
  tokens: AuthTokens | null;
}

export interface CreateConsultancyRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  regId?: string;
}

export interface RegisterAdminRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  tenantId: string;
}
