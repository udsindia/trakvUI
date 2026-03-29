import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
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

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 400);
    });

    console.info("Mock lead submission payload", payload);
  };

  return {
    form,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
