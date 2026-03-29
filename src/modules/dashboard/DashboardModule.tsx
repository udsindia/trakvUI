import { ModuleScaffold } from "@/shared/components/ModuleScaffold";

export default function DashboardModule() {
  return (
    <ModuleScaffold
      capabilities={[
        "KPI cards",
        "Operational widgets",
        "Tenant-level summaries",
        "Role-specific insights",
      ]}
      description="This module will host the cross-functional overview for counsellors, operations teams, and tenant administrators."
      title="Dashboard"
    />
  );
}

