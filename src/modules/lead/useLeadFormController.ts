import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { leadService } from "@/modules/lead/leadService";
import type { LeadDetails } from "@/modules/lead/leadApi";
import { selectAuthTenant } from "@/app/auth/authSlice";
import { useAppSelector } from "@/app/store/hooks";
import {
  COLLEGE_SOURCE,
  OTHER_SOURCE,
  type AgentOption,
  type CreateLeadPayload,
  type LeadFormValues,
} from "@/modules/lead/leadForm.types";
import { leadFormOptions } from "@/modules/lead/leadForm.options";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const defaultLeadFormValues: LeadFormValues = {
  agent: "",
  collegeName: "",
  otherSource: "",
  countries: [],
  courses: [],
  currentStudyLevel: "Not Specified",
  email: "",
  englishProficiencyTest: "",
  englishProficiencyTestScore: "",
  intakeDate: "",
  isWhatsAppAvailable: false,
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
    // "Other" is a UI affordance, never a stored source name — the typed text is what
    // gets saved, and the backend creates the lead_sources row if it is new.
    leadSource:
      values.source === OTHER_SOURCE ? values.otherSource.trim() : values.source,
    // Always sent (even blank) so switching away from College clears any
    // previously-saved college name on edit rather than leaving it stale.
    college: values.source === COLLEGE_SOURCE ? values.collegeName.trim() : "",
    countriesOfInterest: values.countries,
    intakeMonth,
    year,
    fieldOfStudy: values.courses[0] ?? "Not Specified",
    currentStudyLevel: values.currentStudyLevel || "Not Specified",
    isWhatsAppAvailable: values.isWhatsAppAvailable,
    englishProficiencyTest: values.englishProficiencyTest || undefined,
    englishProficiencyTestScore: values.englishProficiencyTestScore || undefined,
    notes: values.notes,
  };
}

/** Reverses buildCreateLeadPayload — pre-fills the form when editing an existing lead. */
export function mapLeadDetailsToFormValues(lead: LeadDetails): LeadFormValues {
  const monthIndex = lead.targetIntakeMonth
    ? MONTH_NAMES.findIndex((m) => m.toLowerCase() === lead.targetIntakeMonth?.toLowerCase())
    : -1;
  const intakeDate =
    lead.targetIntakeYear && monthIndex >= 0
      ? `${lead.targetIntakeYear}-${String(monthIndex + 1).padStart(2, "0")}-01`
      : "";

  // A lead saved with a source the dropdown does not offer (older data already has
  // Instagram, GOOGLE_ADS, META_ADS…) would otherwise open with the field blank and
  // silently lose its source on save. Show those as "Other" with the text filled in.
  const savedSource = lead.sourceName ?? "";
  const isKnownSource =
    !savedSource || leadFormOptions.sourceOptions.includes(savedSource);

  return {
    agent: lead.assignedToId ?? "",
    collegeName: lead.college ?? "",
    otherSource: isKnownSource ? "" : savedSource,
    countries: lead.destinationCountries ?? [],
    courses: lead.fieldOfStudy ? [lead.fieldOfStudy] : [],
    currentStudyLevel: lead.currentStudyLevel || "Not Specified",
    email: lead.email ?? "",
    englishProficiencyTest: lead.englishProficiencyTest ?? "",
    englishProficiencyTestScore: lead.englishProficiencyTestScore ?? "",
    intakeDate,
    isWhatsAppAvailable: lead.isWhatsAppAvailable ?? false,
    name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
    notes: lead.notes ?? "",
    phone: [lead.countryCode, lead.phone].filter(Boolean).join(" ").trim(),
    source: isKnownSource ? savedSource : OTHER_SOURCE,
    tags: [],
  };
}

type UseLeadFormControllerOptions = {
  agentOptions?: AgentOption[];
  /** When set, the form edits this lead instead of creating a new one. */
  editingLeadId?: string;
};

export function useLeadFormController({
  agentOptions = [],
  editingLeadId,
}: UseLeadFormControllerOptions = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenant = useAppSelector(selectAuthTenant);
  const form = useForm<LeadFormValues>({
    defaultValues: defaultLeadFormValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const isEditing = Boolean(editingLeadId);
  const returnPath = isEditing ? leadRoutePaths.details(editingLeadId!) : leadRoutePaths.dashboard;

  const handleCancel = () => {
    form.reset(defaultLeadFormValues);
    navigate(returnPath);
  };

  const handleValidSubmit = async (values: LeadFormValues) => {
    const payload = buildCreateLeadPayload(values, agentOptions);

    try {
      if (editingLeadId) {
        await leadService.updateLead(editingLeadId, payload);
        await queryClient.invalidateQueries({ queryKey: ["lead", editingLeadId] });
      } else {
        payload.tenantId = tenant?.tenantId;
        await leadService.createLead(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["leads", "paginated"] });
      form.reset(defaultLeadFormValues);
      navigate(returnPath);
    } catch (error) {
      console.error(`Failed to ${editingLeadId ? "update" : "create"} lead:`, error);

      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout"));

      form.setError("root", {
        message: isTimeout
          ? "The server is warming up — your data is safe. Click Save Lead to try again."
          : `Failed to ${editingLeadId ? "update" : "save"} the lead. Please try again.`,
      });
    }
  };

  return {
    form,
    handleCancel,
    handleFormSubmit: form.handleSubmit(handleValidSubmit),
    isEditing,
  };
}
