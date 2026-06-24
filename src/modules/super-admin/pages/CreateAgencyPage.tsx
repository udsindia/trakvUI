import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Card, CardContent, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AgencyForm,
  defaultCreateAgencyValues,
} from "@/modules/super-admin/components/AgencyForm";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";
import { agenciesService } from "@/modules/super-admin/agenciesService";
import { superAdminRoutePaths } from "@/modules/super-admin/superAdminRoutePaths";
import type { CreateAgencyRequest } from "@/modules/super-admin/superAdmin.types";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

export function CreateAgencyPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgencyRequest>({
    defaultValues: defaultCreateAgencyValues,
    mode: "onBlur",
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateAgencyRequest) => agenciesService.createAgency(request),
    onSuccess: (agency) => {
      navigate(superAdminRoutePaths.agencyDetail(agency.id));
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error, "Unable to create agency."));
    },
  });

  const onSubmit = async (values: CreateAgencyRequest) => {
    setServerError(null);
    await createMutation.mutateAsync(values);
  };

  return (
    <Stack spacing={3}>
      <SuperAdminPageHeader
        eyebrow="Platform · Agencies"
        subtitle="Onboard a new consultancy tenant and its first admin user."
        title="Create Agency"
      />

      {serverError ? <Alert severity="error">{serverError}</Alert> : null}

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
            <AgencyForm
              control={control}
              errors={errors}
              isSubmitting={isSubmitting || createMutation.isPending}
              submitLabel={createMutation.isPending ? "Creating agency..." : "Create Agency"}
              onCancel={() => navigate(superAdminRoutePaths.agencies)}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
