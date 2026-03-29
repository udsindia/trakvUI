import type { ComponentType, LazyExoticComponent } from "react";
import type { ModuleDefinition } from "@/config/modules/module.types";

export interface ResolvedModule extends ModuleDefinition {
  enabled: boolean;
  accessible: boolean;
  Component: LazyExoticComponent<ComponentType>;
}

