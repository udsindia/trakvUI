import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { leadService } from "@/modules/lead/leadService";
import type {
  CreateLeadPayload,
  LeadFormValues,
} from "@/modules/lead/leadForm.types";

const defaultLeadFormValues: LeadFormValues = {
  agent: "",
  countries: [],
  courses: [],
  email: "",
  intakeDate: "",
  name: "",
  notes: "",
  phone: "",
  source: "",
  tags: [],
};

export function buildCreateLeadPayload(values: LeadFormValues): CreateLeadPayload {
  return {
    agent: values.agent.trim(),
    countries: values.countries,
    courses: values.courses,
    email: values.email.trim(),
    intakeDate: values.intakeDate,
    name: values.name.trim(),
    notes: values.notes.trim(),
    phone: values.phone.trim(),
    source: values.source,
    tags: values.tags,
  };
}

export function useLeadFormController() {
  const navigate = useNavigate();
  const form = useForm<LeadFormValues>({
    defaultValues: defaultLeadFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const handleCancel = () => {
    form.reset(defaultLeadFormValues);
    navigate(leadRoutePaths.dashboard);
  };

  const handleValidSubmit = async (values: LeadFormValues) => {
    const payload = buildCreateLeadPayload(values);

    try {
      await leadService.createLead(payload);
      form.reset(defaultLeadFormValues);
      navigate(leadRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to create lead:", error);
      throw error;
    }
  };

  return {
    form,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
