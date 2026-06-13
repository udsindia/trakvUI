import { useQuery } from "@tanstack/react-query";
import { Alert, CircularProgress, Stack } from "@mui/material";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/app/auth/useAuth";
import { RoleForm } from "@/modules/settings/components/RoleForm";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { useRoleFormController } from "@/modules/settings/hooks/useRoleFormController";
import { rolesService } from "@/modules/settings/rolesService";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function EditRolePage() {
  const { roleId = "" } = useParams();
  const { tenant } = useAuth();
  const tenantId = tenant?.tenantId ?? "";

  const roleQuery = useQuery({
    enabled: Boolean(tenantId && roleId),
    queryKey: ["settings", "role", tenantId, roleId],
    queryFn: () => rolesService.getRoleById(tenantId, roleId),
  });

  const { form, handleCancel, handleFormSubmit, isReadOnly } = useRoleFormController({
    mode: "edit",
    role: roleQuery.data,
  });

  if (!roleId) {
    return <Navigate replace to={settingsRoutePaths.roles} />;
  }

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        eyebrow="Settings · Roles"
        title={roleQuery.data?.name ?? "Edit Role"}
      />

      {roleQuery.isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : null}

      {roleQuery.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(roleQuery.error, "Unable to load role details.")}
        </Alert>
      ) : null}

      {roleQuery.data ? (
        <RoleForm
          form={form}
          isReadOnly={isReadOnly}
          submitLabel="Save Role"
          title={isReadOnly ? "System role permissions" : "Edit role"}
          onCancel={handleCancel}
          onSubmit={handleFormSubmit}
        />
      ) : null}
    </Stack>
  );
}
