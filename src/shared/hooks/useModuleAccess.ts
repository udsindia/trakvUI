import type { ModuleKey } from "@/config/modules/modules";
import { useAuth } from "@/app/auth/useAuth";
import { resolveModules } from "@/app/module-loader/module-registry";

export function useModuleAccess(moduleKey: ModuleKey) {
  const { permissions, roles, tenant } = useAuth();

  return resolveModules({ permissions, roles, tenant }).find(
    (module) => module.key === moduleKey,
  );
}
