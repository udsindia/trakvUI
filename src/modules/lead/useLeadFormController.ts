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
  // Split "John Doe" → firstName="John", lastName="Doe"
  const nameParts = values.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Split "+91 98765 43210" → countryCode="+91", phoneNo="9876543210"
  const cleanPhone = values.phone.replace(/\s/g, "");
  const phoneMatch = cleanPhone.match(/^(\+\d{1,3})(.+)$/);
  const countryCode = phoneMatch?.[1] ?? "+91";
  const phoneNo = phoneMatch?.[2] ?? cleanPhone.replace(/\D/g, "");

  // "2024-09-01" → intakeMonth="September", year=2024
  const intakeDate = new Date(values.intakeDate);
  const intakeMonth = intakeDate.toLocaleString("en-US", { month: "long" }) || "January";
  const year = isNaN(intakeDate.getFullYear()) ? new Date().getFullYear() : intakeDate.getFullYear();

  return {
    firstName,
    lastName,
    countryCode,
    phoneNo,
    emailAddress: values.email.trim(),
    leadSource: values.source,
    countriesOfInterest: values.countries,
    intakeMonth,
    year,
    fieldOfStudy: values.courses[0] ?? "Not Specified",
    currentStudyLevel: "Not Specified",
    isWhatsAppAvailable: false,
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
