import { RoleForm } from "@/modules/settings/components/RoleForm";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { useRoleFormController } from "@/modules/settings/hooks/useRoleFormController";
import { Stack } from "@mui/material";

export function CreateRolePage() {
  const { form, handleCancel, handleFormSubmit } = useRoleFormController({ mode: "create" });

  return (
    <Stack spacing={3}>
      <SettingsPageHeader eyebrow="Settings · Roles" title="Create Role" />
      <RoleForm
        form={form}
        submitLabel="Create Role"
        title="Define a custom role"
        onCancel={handleCancel}
        onSubmit={handleFormSubmit}
      />
    </Stack>
  );
}
