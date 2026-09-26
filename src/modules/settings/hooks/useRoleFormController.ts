import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { selectAuthTenant } from "@/app/auth/authSlice";
import { useAppSelector } from "@/app/store/hooks";
import { rolesService } from "@/modules/settings/rolesService";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import type {
  RoleDefinition,
  RoleFormValues,
} from "@/modules/settings/settings.types";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const defaultRoleFormValues: RoleFormValues = {
  name: "",
  description: "",
  permissions: [],
};

function sanitizeRoleFormValues(values: RoleFormValues): RoleFormValues {
  return {
    name: values.name.trim().replace(/\s+/g, " "),
    description: values.description.trim(),
    permissions: Array.from(new Set(values.permissions)),
  };
}

type UseRoleFormControllerOptions = {
  mode: "create" | "edit";
  role?: RoleDefinition | null;
};

export function useRoleFormController({
  mode,
  role,
}: UseRoleFormControllerOptions) {
  const navigate = useNavigate();
  const tenant = useAppSelector(selectAuthTenant);
  const isReadOnly = role?.type === "system";

  const form = useForm<RoleFormValues>({
    defaultValues: defaultRoleFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!role) {
      return;
    }

    form.reset({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions,
    });
  }, [form, role]);

  const handleCancel = () => {
    navigate(settingsRoutePaths.roles);
  };

  const handleValidSubmit = async (values: RoleFormValues) => {
    if (isReadOnly || !tenant?.tenantId) {
      return;
    }

    if (mode === "edit" && !role) {
      return;
    }

    const payload = sanitizeRoleFormValues(values);

    try {
      if (mode === "create") {
        await rolesService.createCustomRole(tenant.tenantId, payload);
      } else if (role) {
        await rolesService.updateCustomRole(tenant.tenantId, role.id, payload);
      }

      navigate(settingsRoutePaths.roles);
    } catch (error) {
      form.setError("root", {
        message: getApiErrorMessage(error, "Failed to save the role."),
      });
    }
  };

  return {
    form,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
    isReadOnly,
  };
}
