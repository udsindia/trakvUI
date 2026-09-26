import { AxiosHeaders, type AxiosRequestConfig } from "axios";
import { authService } from "@/app/auth/authService";
import { saAuthService } from "@/modules/sa-team/saAuthService";

export function resolveAccessToken(): string | null {
  return authService.getAccessToken() ?? saAuthService.getToken();
}

export function createAuthRequestConfig(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  const accessToken = resolveAccessToken();

  if (!accessToken) {
    throw new Error("Authentication required. Sign in to access this resource.");
  }

  const headers = AxiosHeaders.from(config.headers as AxiosHeaders);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...config,
    headers,
  };
}
