import { Chip } from "@mui/material";

/** The industries a tenant can run as. The backend decides which modules each one gets. */
export const INDUSTRIES = [
  {
    value: "EDUCATION",
    label: "Education",
    description: "Study-abroad consultancy: students, applications, universities and commissions.",
  },
  {
    value: "STUDIO",
    label: "Studio",
    description: "Podcast or video studio: leads, bookings and WhatsApp follow-ups. No education modules.",
  },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["value"];

export const DEFAULT_INDUSTRY: Industry = "EDUCATION";

export function industryLabel(industry: string | null | undefined): string {
  return INDUSTRIES.find((i) => i.value === industry)?.label ?? "Education";
}

/** A tenant without an industry predates the field and runs as Education. */
export function IndustryChip({ industry }: { industry: string | null | undefined }) {
  const studio = industry === "STUDIO";
  return (
    <Chip
      label={industryLabel(industry)}
      size="small"
      variant="outlined"
      color={studio ? "secondary" : "default"}
    />
  );
}
