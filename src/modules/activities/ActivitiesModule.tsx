import { ModuleScaffold } from "@/shared/components/ModuleScaffold";

export default function ActivitiesModule() {
  return (
    <ModuleScaffold
      capabilities={[
        "Task timelines",
        "Counsellor follow-ups",
        "Reminder scheduling",
        "Activity audit trail",
      ]}
      description="This module will carry coordination, reminder, and engagement activity flows across the counselling lifecycle."
      title="Activities"
    />
  );
}

