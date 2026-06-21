import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import type { DashboardLeadPipelineDto } from "@/modules/dashboard/dashboard.types";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";
import { PipelineBars } from "@/modules/dashboard/components/PipelineBars";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";

type DemoLead = {
  assigned: string;
  email: string;
  lastContact: string;
  name: string;
  source: string;
  sourceTone: "meta" | "referral" | "walkin";
  stage: string;
  stageTone: "new" | "contacted" | "qualified";
  unattended?: boolean;
  unassigned?: boolean;
};

const DEMO_LEADS: DemoLead[] = [
  {
    name: "Priya Sharma",
    email: "priya@gmail.com",
    source: "Meta Ads",
    sourceTone: "meta",
    stage: "Qualified",
    stageTone: "qualified",
    assigned: "AS",
    lastContact: "Today 9:14am",
  },
  {
    name: "Rohan Mehta",
    email: "rohan@gmail.com",
    source: "Referral",
    sourceTone: "referral",
    stage: "New",
    stageTone: "new",
    assigned: "—",
    lastContact: "4 days ago",
    unattended: true,
  },
  {
    name: "Ananya Patel",
    email: "ananya@yahoo.com",
    source: "Meta Ads",
    sourceTone: "meta",
    stage: "Contacted",
    stageTone: "contacted",
    assigned: "RK",
    lastContact: "Yesterday",
  },
  {
    name: "Karan Singh",
    email: "karan@hotmail.com",
    source: "Walk-in",
    sourceTone: "walkin",
    stage: "New",
    stageTone: "new",
    assigned: "!",
    lastContact: "3 days — unassigned",
    unattended: true,
    unassigned: true,
  },
  {
    name: "Divya Nair",
    email: "divya@gmail.com",
    source: "Referral",
    sourceTone: "referral",
    stage: "Qualified",
    stageTone: "qualified",
    assigned: "AS",
    lastContact: "18 Jun",
  },
  {
    name: "Amit Verma",
    email: "amit@gmail.com",
    source: "Meta Ads",
    sourceTone: "meta",
    stage: "New",
    stageTone: "new",
    assigned: "—",
    lastContact: "5 days ago",
    unattended: true,
  },
];

const SOURCE_STYLES = {
  meta: { bgcolor: "#EEF2FF", color: "#4338CA" },
  referral: { bgcolor: "#F0FDF4", color: "#166634" },
  walkin: { bgcolor: "#FFF7ED", color: "#C2410C" },
};

const STAGE_STYLES = {
  new: { bgcolor: "#E0F2FE", color: "#075985" },
  contacted: { bgcolor: "#F0F9FA", color: "#005F6B" },
  qualified: { bgcolor: "#DCFCE7", color: "#166534" },
};

type FilterKey = "all" | "unattended" | "unassigned" | "followup";

type DashboardLeadsSectionProps = {
  leadsScope: string;
  pipeline?: DashboardLeadPipelineDto;
  showUnassigned: boolean;
};

function LeadFilterChips({
  activeFilter,
  onFilterChange,
  showUnassigned,
}: {
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  showUnassigned: boolean;
}) {
  const chips: { filter: FilterKey; label: string; tone?: "warn" | "danger" }[] = [
    { filter: "all", label: "All (284)" },
    { filter: "unattended", label: "⚠ Unattended (6)", tone: "warn" },
    ...(showUnassigned ? [{ filter: "unassigned" as const, label: "Unassigned (4)", tone: "danger" as const }] : []),
    { filter: "followup", label: "Follow-up Due (12)" },
  ];

  return (
    <Stack direction="row" spacing={0.625} sx={{ flexShrink: 0, flexWrap: "wrap", mb: 0.875 }}>
      {chips.map((chip) => {
        const active = activeFilter === chip.filter;

        return (
          <Typography
            component="button"
            key={chip.filter}
            sx={{
              background:
                active && chip.tone === "warn"
                  ? "warning.main"
                  : active && chip.tone === "danger"
                    ? "error.main"
                    : active
                      ? "primary.main"
                      : chip.tone === "warn"
                        ? "#FFFBEB"
                        : chip.tone === "danger"
                          ? "#FEF2F2"
                          : "#fff",
              border: "1.5px solid",
              borderColor:
                active || !chip.tone
                  ? active
                    ? chip.tone === "warn"
                      ? "warning.main"
                      : chip.tone === "danger"
                        ? "error.main"
                        : "primary.main"
                    : "divider"
                  : chip.tone === "warn"
                    ? "warning.main"
                    : "error.main",
              borderRadius: 10,
              color:
                active
                  ? "#fff"
                  : chip.tone === "warn"
                    ? "#92400E"
                    : chip.tone === "danger"
                      ? "#991B1B"
                      : "text.secondary",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 700,
              px: 1.25,
              py: 0.375,
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: "primary.main",
                color: active ? "#fff" : "primary.main",
              },
            }}
            onClick={() => onFilterChange(chip.filter)}
          >
            {chip.label}
          </Typography>
        );
      })}
    </Stack>
  );
}

export function DashboardLeadsSection({
  leadsScope,
  pipeline,
  showUnassigned,
}: DashboardLeadsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredLeads = DEMO_LEADS.filter((lead) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unattended") return lead.unattended;
    if (activeFilter === "unassigned") return lead.unassigned;
    if (activeFilter === "followup") return lead.unattended;
    return true;
  });

  const defaultStages = [
    { label: "New", count: 420, color: "#007A87" },
    { label: "Contacted", count: 336, color: "#1393A0" },
    { label: "Qualified", count: 243, color: "#10B981" },
    { label: "Applied", count: 159, color: "#F5820D" },
    { label: "Enrolled", count: 92, color: "#8B5CF6" },
  ];

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack spacing={1} sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard
          action={<PanelLink>Full view →</PanelLink>}
          title="Lead Pipeline"
        >
          <PipelineBars stages={pipeline?.stages ?? defaultStages} />
        </PanelCard>

        <PanelCard
          action={
            <PanelLink>
              <RouterLink style={{ color: "inherit", textDecoration: "none" }} to={leadRoutePaths.dashboard}>
                All leads →
              </RouterLink>
            </PanelLink>
          }
          grow
          title={leadsScope}
        >
          <LeadFilterChips
            activeFilter={activeFilter}
            showUnassigned={showUnassigned}
            onFilterChange={setActiveFilter}
          />
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <Box component="table" sx={{ borderCollapse: "collapse", width: "100%" }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: "#FAFBFC", position: "sticky", top: 0, zIndex: 1 }}>
                  {["Lead", "Source", "Stage", "Assigned", "Last Contact"].map((header) => (
                    <Box
                      component="th"
                      key={header}
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        color: "text.disabled",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        px: 1.125,
                        py: 0.625,
                        textAlign: "left",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filteredLeads.map((lead) => (
                  <Box
                    component="tr"
                    key={lead.email}
                    sx={{
                      bgcolor: lead.unattended ? "#FFFBEB" : "transparent",
                      "&:hover td": { bgcolor: lead.unattended ? "#FEF3C7" : "#FAFBFF" },
                    }}
                  >
                    <Box component="td" sx={{ borderBottom: "1px solid #F8FAFC", px: 1.125, py: 0.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{lead.name}</Typography>
                      <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{lead.email}</Typography>
                    </Box>
                    <Box component="td" sx={{ borderBottom: "1px solid #F8FAFC", px: 1.125, py: 0.75 }}>
                      <Box
                        component="span"
                        sx={{
                          ...SOURCE_STYLES[lead.sourceTone],
                          borderRadius: 0.5,
                          fontSize: 8,
                          fontWeight: 700,
                          px: 0.625,
                          py: 0.25,
                        }}
                      >
                        {lead.source}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ borderBottom: "1px solid #F8FAFC", px: 1.125, py: 0.75 }}>
                      <Box
                        component="span"
                        sx={{
                          ...STAGE_STYLES[lead.stageTone],
                          borderRadius: 10,
                          display: "inline-flex",
                          fontSize: 9,
                          fontWeight: 700,
                          px: 0.75,
                          py: 0.25,
                        }}
                      >
                        {lead.stage}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ borderBottom: "1px solid #F8FAFC", px: 1.125, py: 0.75 }}>
                      <Box
                        sx={{
                          alignItems: "center",
                          background:
                            lead.assigned === "!"
                              ? "#FEE2E2"
                              : lead.assigned === "—"
                                ? "divider"
                                : "linear-gradient(135deg, #007A87, #15A6B8)",
                          borderRadius: "50%",
                          color: lead.assigned === "!" ? "#991B1B" : lead.assigned === "—" ? "text.disabled" : "#fff",
                          display: "inline-flex",
                          fontSize: 8,
                          fontWeight: 700,
                          height: 22,
                          justifyContent: "center",
                          width: 22,
                        }}
                      >
                        {lead.assigned}
                      </Box>
                    </Box>
                    <Box component="td" sx={{ borderBottom: "1px solid #F8FAFC", px: 1.125, py: 0.75 }}>
                      {lead.unattended ? (
                        <Box
                          component="span"
                          sx={{
                            bgcolor: lead.unassigned ? "#FEE2E2" : "#FDE68A",
                            borderRadius: 0.5,
                            color: lead.unassigned ? "#991B1B" : "#92400E",
                            fontSize: 8,
                            fontWeight: 700,
                            px: 0.625,
                            py: 0.125,
                          }}
                        >
                          {lead.lastContact}
                        </Box>
                      ) : (
                        <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{lead.lastContact}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard grow title="Lead Source">
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              justifyContent: "center",
              minHeight: 140,
            }}
          >
            <Box
              sx={{
                background: "conic-gradient(#007A87 0 38%, #10B981 38% 60%, #F5820D 60% 74%, #0EA5E9 74% 86%, #25D366 86% 94%, #9CA3AF 94% 100%)",
                borderRadius: "50%",
                height: 120,
                position: "relative",
                width: 120,
                "&::after": {
                  bgcolor: "#fff",
                  borderRadius: "50%",
                  content: '""',
                  height: 72,
                  left: "50%",
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 72,
                },
              }}
            />
          </Box>
          <Stack direction="row" sx={{ borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", pt: 1 }}>
            {[
              { value: "524", label: "Meta Ads", color: "primary.main" },
              { value: "312", label: "Referral", color: "success.main" },
              { value: "198", label: "Walk-in", color: "secondary.main" },
            ].map((stat) => (
              <Box key={stat.label} sx={{ textAlign: "center" }}>
                <Typography sx={{ color: stat.color, fontSize: 15, fontWeight: 800 }}>{stat.value}</Typography>
                <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Stack>
        </PanelCard>

        <PanelCard title="Conversion Snapshot">
          <Stack direction="row" sx={{ justifyContent: "space-around", textAlign: "center" }}>
            {[
              { value: "22%", label: "Lead→Enrol", color: "primary.main" },
              { value: "58%", label: "Qual rate", color: "success.main" },
              { value: "3.2d", label: "Avg resp.", color: "secondary.main" },
            ].map((stat) => (
              <Box key={stat.label}>
                <Typography sx={{ color: stat.color, fontSize: 16, fontWeight: 800 }}>{stat.value}</Typography>
                <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{stat.label}</Typography>
              </Box>
            ))}
          </Stack>
        </PanelCard>
      </Stack>
    </Stack>
  );
}
