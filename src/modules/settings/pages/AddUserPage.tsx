import { Stack } from "@mui/material";
import { AddUserForm } from "@/modules/settings/components/AddUserForm";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { useAddUserFormController } from "@/modules/settings/hooks/useAddUserFormController";

export function AddUserPage() {
  const { form, handleCancel, handleFormSubmit, roles } = useAddUserFormController();

  return (
    <Stack spacing={3}>
      <SettingsPageHeader eyebrow="Settings · Team" title="Add User" />
      <AddUserForm
        form={form}
        roles={roles}
        onCancel={handleCancel}
        onSubmit={handleFormSubmit}
      />
    </Stack>
  );
}
