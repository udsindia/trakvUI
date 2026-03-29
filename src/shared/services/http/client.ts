import axios, { AxiosHeaders } from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
