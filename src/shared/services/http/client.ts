import axios, { AxiosHeaders } from "axios";
import { API_CONFIG, } from "@/config/api/config";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

console.debug("[httpClient] Initialising with baseURL:", BASE_URL);

export const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60s — allows for Render free-tier cold starts (~30-50s)
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Debug interceptors ──────────────────────────────────────────────────────

httpClient.interceptors.request.use((config) => {
  console.debug(
    `[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    ...(config.params ? ["| params:", config.params] : []),
    ...(config.data ? ["| body:", config.data] : []),
  );
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    console.debug(
      `[API ←] ${response.status} ${response.config.url}`,
      "| data:",
      response.data,
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[API ✗] ${error.response.status} ${error.config?.url}`,
        "| error data:",
        error.response.data,
      );
    } else {
      console.error(`[API ✗] Network/timeout error on ${error.config?.url}`, error.message);
    }
    return Promise.reject(error);
  },
);

export function registerHttpClientAuthInterceptor({
  getAccessToken,
  onUnauthorized,
}: {
  getAccessToken: () => string | null;
  onUnauthorized?: () => void;
}) {
  const requestInterceptorId = httpClient.interceptors.request.use((config) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return config;
    }

    if (config.headers && "set" in config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
      return config;
    }

    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${accessToken}`);

    return config;
  });

  const responseInterceptorId = httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const requestUrl = String(error.config?.url ?? "");
      const isLoginRequest = requestUrl.endsWith("/auth/login");

      if (error.response?.status === 401 && !isLoginRequest) {
        onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return () => {
    httpClient.interceptors.request.eject(requestInterceptorId);
    httpClient.interceptors.response.eject(responseInterceptorId);
  };
}
