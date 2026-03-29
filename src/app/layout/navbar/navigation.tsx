import type { ReactNode } from "react";
import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import EventNoteRounded from "@mui/icons-material/EventNoteRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import type { ResolvedModule } from "@/app/module-loader/module.types";
import type {
  ModuleIconKey,
  ModuleNavigationItemDefinition,
} from "@/config/modules/module.types";

export interface NavigationItem {
  id: string;
  label: string;
  to?: string;
  description?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
}

const moduleIconMap: Record<ModuleIconKey, ReactNode> = {
  dashboard: <AssessmentRounded />,
  leads: <GroupRounded />,
  applications: <DescriptionRounded />,
  activities: <EventNoteRounded />,
};

function normalizeRoutePath(path: string) {
  if (path === "/") {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return normalizedPath.replace(/\/+$/, "");
}

function resolveRoutePath(path: string, parentPath?: string) {
  if (!parentPath) {
    return normalizeRoutePath(path);
  }

  const normalizedParentPath = normalizeRoutePath(parentPath);
  const normalizedPath = normalizeRoutePath(path);

  if (path.startsWith("/") || normalizedPath.startsWith(`${normalizedParentPath}/`)) {
    return normalizedPath;
  }

  return `${normalizedParentPath}/${path.replace(/^\/+/, "")}`;
}

function mapNavigationItem(
  item: ModuleNavigationItemDefinition,
  options: {
    keyPrefix?: string;
    parentPath?: string;
  } = {},
): NavigationItem {
  const resolvedPath = resolveRoutePath(item.path, options.parentPath);
  const navigationItemId = options.keyPrefix ? `${options.keyPrefix}.${item.key}` : item.key;

  return {
    id: navigationItemId,
    label: item.navLabel,
    to: resolvedPath,
    description: item.description,
    icon: item.icon ? moduleIconMap[item.icon] : undefined,
    children: item.children?.map((child) =>
      mapNavigationItem(child, {
        keyPrefix: navigationItemId,
        parentPath: resolvedPath,
      }),
    ),
  };
}

export function getNavigationItems(modules: ResolvedModule[]) {
  return modules.map((module) => mapNavigationItem(module));
}

function normalizePath(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function matchesNavigationPath(pathname: string, targetPath: string) {
  const normalizedPathname = normalizePath(pathname);
  const normalizedTargetPath = normalizePath(targetPath);

  return (
    normalizedPathname === normalizedTargetPath ||
    normalizedPathname.startsWith(`${normalizedTargetPath}/`)
  );
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  if (item.to && matchesNavigationPath(pathname, item.to)) {
    return true;
  }

  return item.children?.some((child) => isNavigationItemActive(pathname, child)) ?? false;
}
