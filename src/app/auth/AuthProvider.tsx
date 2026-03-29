import { useEffect, type PropsWithChildren } from "react";
import { authService } from "@/app/auth/authService";
import { initializeAuthSession, logout } from "@/app/auth/authSlice";
import { useAppDispatch } from "@/app/store/hooks";
import { registerHttpClientAuthInterceptor } from "@/shared/services/http/client";

export function AuthProvider({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(initializeAuthSession());
  }, [dispatch]);

  useEffect(() => {
    return registerHttpClientAuthInterceptor({
      getAccessToken: () => authService.getAccessToken(),
      onUnauthorized: () => {
        void dispatch(logout());
      },
    });
  }, [dispatch]);

  return children;
}
