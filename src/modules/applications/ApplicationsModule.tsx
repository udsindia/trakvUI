import { ModuleScaffold } from "@/shared/components/ModuleScaffold";

export default function ApplicationsModule() {
  return (
    <ModuleScaffold
      capabilities={[
        "Application stages",
        "Document workflows",
        "Decision tracking",
        "Future form orchestration",
      ]}
      description="This module will evolve into the application management workspace for visa and admission case processing."
      title="Applications"
    />
  );
}

