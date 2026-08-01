import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { selectAuthTenant } from "@/app/auth/authSlice";
import { useAppSelector } from "@/app/store/hooks";
import { rolesService } from "@/modules/settings/rolesService";
import { settingsRoutePaths } from "@/modules/settings/settingsRoutePaths";
import type { AddUserFormValues } from "@/modules/settings/settings.types";
import { usersService } from "@/modules/settings/usersService";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

const defaultValues: AddUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleId: "",
  supervisorId: "",
};

export function useAddUserFormController() {
  const navigate = useNavigate();
  const tenant = useAppSelector(selectAuthTenant);
  const tenantId = tenant?.tenantId ?? "";

  const rolesQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ["settings", "roles", tenantId],
    queryFn: () => rolesService.getRoles(tenantId),
  });

  // Supervisor candidates — a Manager or the Agency Admin picks up the new user's team.
  const usersQuery = useQuery({
    enabled: Boolean(tenantId),
    queryKey: ["settings", "users", tenantId],
    queryFn: () => usersService.getUsers(tenantId),
  });

  const form = useForm<AddUserFormValues>({
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const handleCancel = () => {
    navigate(settingsRoutePaths.team);
  };

  const handleValidSubmit = async (values: AddUserFormValues) => {
    if (!tenantId) {
      form.setError("root", { message: "Tenant context is unavailable." });
      return;
    }

    const selectedRole = rolesQuery.data?.find(
      (role) => role.id === values.roleId,
    );

    if (!selectedRole) {
      form.setError("roleId", { message: "Select a valid role." });
      return;
    }

    try {
      await usersService.createUser({
        tenantId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        role: selectedRole.roleName,
        supervisorId: values.supervisorId || undefined,
      });
      navigate(settingsRoutePaths.team);
    } catch (error) {
      form.setError("root", {
        message: getApiErrorMessage(error, "Failed to create the user."),
      });
    }
  };

  return {
    form,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
    roles: rolesQuery.data ?? [],
    supervisors: usersQuery.data ?? [],
  };
}
