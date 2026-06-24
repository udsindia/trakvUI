import { Chip } from "@mui/material";
import type { Agency, AgencyStatus, SubscriptionPlan, VerificationStatus } from "@/modules/super-admin/superAdmin.types";

const STATUS_CONFIG: Record<
  AgencyStatus,
  { color: "default" | "success" | "warning" | "error"; label: string }
> = {
  active: { color: "success", label: "Active" },
  inactive: { color: "default", label: "Inactive" },
  suspended: { color: "error", label: "Suspended" },
  pending_verification: { color: "warning", label: "Pending" },
};

const VERIFICATION_CONFIG: Record<
  VerificationStatus,
  { color: "default" | "success" | "warning" | "error"; label: string }
> = {
  verified: { color: "success", label: "Verified" },
  pending: { color: "warning", label: "Pending" },
  rejected: { color: "error", label: "Rejected" },
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: "Trial",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export function AgencyStatusChip({ status }: { status: AgencyStatus }) {
  const config = STATUS_CONFIG[status];
  return <Chip color={config.color} label={config.label} size="small" variant="outlined" />;
}

export function VerificationChip({ status }: { status: VerificationStatus }) {
  const config = VERIFICATION_CONFIG[status];
  return <Chip color={config.color} label={config.label} size="small" variant="outlined" />;
}

export function SubscriptionChip({ plan }: { plan: SubscriptionPlan }) {
  return <Chip label={PLAN_LABELS[plan]} size="small" variant="outlined" />;
}

export function formatAgencyLocation(agency: Agency) {
  return [agency.city, agency.state, agency.country].filter(Boolean).join(", ");
}

export function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
