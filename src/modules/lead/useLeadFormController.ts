import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { leadService } from "@/modules/lead/leadService";
import { selectAuthTenant } from "@/app/auth/authSlice";
import { useAppSelector } from "@/app/store/hooks";
import { usersApi } from "@/modules/settings/usersApi";
import type {
  AgentOption,
  CreateLeadPayload,
  LeadFormValues,
} from "@/modules/lead/leadForm.types";

function displayName(user: { name?: string; firstName?: string; lastName?: string; email: string }) {
  return user.name ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email);
}

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

export function buildCreateLeadPayload(
  values: LeadFormValues,
  agentOptions: AgentOption[] = [],
): CreateLeadPayload {
  // Split "John Doe" → firstName="John", lastName="Doe"
  const nameParts = values.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  // Split "+91 98765 43210" or "+91-9876543210" → countryCode="+91", phoneNo="9876543210"
  const cleanPhone = values.phone.replace(/\s/g, "");
  const phoneMatch = cleanPhone.match(/^(\+\d{1,3})(.+)$/);
  const countryCode = phoneMatch?.[1] ?? "+91";
  const phoneNo = (phoneMatch?.[2] ?? cleanPhone).replace(/\D/g, "");

  // "2024-09-01" → intakeMonth="September", year=2024
  const intakeDate = new Date(values.intakeDate);
  const intakeMonth = intakeDate.toLocaleString("en-US", { month: "long" }) || "January";
  const year = isNaN(intakeDate.getFullYear()) ? new Date().getFullYear() : intakeDate.getFullYear();
  const assignedAgent = agentOptions.find(
    (agentOption) => agentOption.agentId === values.agent,
  );

  return {
    assignedToId: values.agent,
    assignedToName: assignedAgent?.agentName ?? "",
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
  const queryClient = useQueryClient();
  const tenant = useAppSelector(selectAuthTenant);
  const tenantId = tenant?.tenantId;
  const form = useForm<LeadFormValues>({
    defaultValues: defaultLeadFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { data: agentOptions = [] } = useQuery({
    queryKey: ["users", tenantId],
    queryFn: () => usersApi.getUsers(tenantId!),
    enabled: Boolean(tenantId),
    select: (users): AgentOption[] =>
      users
        .filter((u) => (u.isActive ?? u.active ?? true))
        .map((u) => ({ agentId: u.id, agentName: displayName(u) })),
  });

  const handleCancel = () => {
    form.reset(defaultLeadFormValues);
    navigate(leadRoutePaths.dashboard);
  };

  const handleValidSubmit = async (values: LeadFormValues) => {
    const payload = buildCreateLeadPayload(values, agentOptions);
    payload.tenantId = tenant?.tenantId;

    try {
      await leadService.createLead(payload);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      form.reset(defaultLeadFormValues);
      navigate(leadRoutePaths.dashboard);
    } catch (error) {
      console.error("Failed to create lead:", error);

      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout"));

      form.setError("root", {
        message: isTimeout
          ? "The server is warming up — your data is safe. Click Save Lead to try again."
          : "Failed to save the lead. Please try again.",
      });
    }
  };

  return {
    form,
    agentOptions,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
  };
}
