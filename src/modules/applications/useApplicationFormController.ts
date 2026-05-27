import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { applicationsRoutePaths } from "@/modules/applications/applicationsRoutePaths";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { leadApi } from "@/modules/lead/leadApi";
import type {
  CreateApplicationPayload,
  ApplicationFormValues,
} from "@/modules/applications/applicationForm.types";
import { useEffect } from "react";

const defaultApplicationFormValues: ApplicationFormValues = {
  studentName: "",
  email: "",
  phone: "",
  targetCountry: "",
  targetUniversity: "",
  course: "",
  intakeMonth: "",
  intakeYear: new Date().getFullYear(),
};

export function buildCreateApplicationPayload(values: ApplicationFormValues): CreateApplicationPayload {
  return {
    ...values,
    stage: "Draft",
  };
}

export function useApplicationFormController() {
  const navigate = useNavigate();
  const form = useForm<ApplicationFormValues>({
    defaultValues: defaultApplicationFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { watch, setValue } = form;
  const selectedLeadId = watch("leadId");

  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  useEffect(() => {
    if (selectedLeadId && leads) {
      const lead = leads.find((l) => l.id === selectedLeadId);
      if (lead) {
        setValue("studentName", `${lead.firstName} ${lead.lastName}`.trim(), { shouldValidate: true });
        setValue("email", lead.email, { shouldValidate: true });
        setValue("phone", lead.phone, { shouldValidate: true });
        if (lead.destinationCountries?.length > 0) {
          setValue("targetCountry", lead.destinationCountries[0], { shouldValidate: true });
        }
      }
    }
  }, [selectedLeadId, leads, setValue]);

  const handleCancel = () => {
    form.reset(defaultApplicationFormValues);
    navigate(applicationsRoutePaths.dashboard);
  };

  const handleValidSubmit = async (values: ApplicationFormValues) => {
    const payload = buildCreateApplicationPayload(values);

    try {
      await applicationsApi.createApplication(payload);
      form.reset(defaultApplicationFormValues);
      navigate(applicationsRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to create application:", error);

      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout"));

      form.setError("root", {
        message: isTimeout
          ? "The server is warming up — your data is safe. Click Save Application to try again."
          : "Failed to save the application. Please try again.",
      });
    }
  };

  return {
    form,
    leads: leads ?? [],
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
