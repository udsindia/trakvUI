import { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import { FeedbackState } from "@/shared/components/FeedbackState";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

export function AuthGuard() {
  const { isAuthenticated, isInitializing, tenant } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !tenant) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

export function ModuleGuard({ module }: { module: ResolvedModule }) {
  if (!module.enabled) {
    return (
      <FeedbackState
        eyebrow="Module Disabled"
        title={`${module.title} is not enabled for this tenant`}
        description="Tenant configuration is evaluated before a module is mounted, so disabled modules stay isolated from the active application surface."
      />
    );
  }

  if (!module.accessible) {
    return <Navigate replace to="/unauthorized" />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <module.Component />
    </Suspense>
  );
}
