import { Box, Stack, Typography } from "@mui/material";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";

const TEAM_MEMBERS = [
  { rank: "gold", initials: "AS", name: "Anjali Singh", role: "Sr. Counsellor", leads: 28, enrolled: 12, conv: "43%", target: 90, gradient: "linear-gradient(135deg, #007A87, #15A6B8)" },
  { rank: "silver", initials: "MJ", name: "Meena Joshi", role: "Counsellor", leads: 22, enrolled: 9, conv: "41%", target: 73, gradient: "linear-gradient(135deg, #F5820D, #FFB04A)" },
  { rank: "bronze", initials: "RK", name: "Ravi Kumar", role: "Agency Admin", leads: 17, enrolled: 6, conv: "35%", target: 56, gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)" },
  { rank: "4", initials: "SP", name: "Suresh Pillai", role: "Lead Manager", leads: 12, enrolled: 4, conv: "33%", target: 40, gradient: "linear-gradient(135deg, #0EA5E9, #38BDF8)" },
  { rank: "5", initials: "NK", name: "Nisha Kapoor", role: "Counsellor", leads: 9, enrolled: 2, conv: "22%", target: 30, gradient: "linear-gradient(135deg, #EC4899, #F472B6)" },
];

const RANK_COLORS = {
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#C87533",
};

export function DashboardTeamSection() {
  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard action={<PanelLink>Full report →</PanelLink>} grow title="Team Performance">
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {TEAM_MEMBERS.map((member) => (
              <Stack
                direction="row"
                key={member.name}
                spacing={1.125}
                sx={{
                  alignItems: "center",
                  borderBottom: "1px solid #F8FAFC",
                  py: 0.875,
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Box sx={{ flexShrink: 0, textAlign: "center", width: 16 }}>
                  {member.rank === "gold" || member.rank === "silver" || member.rank === "bronze" ? (
                    <EmojiEventsRounded
                      sx={{
                        color: RANK_COLORS[member.rank as keyof typeof RANK_COLORS],
                        fontSize: 14,
                      }}
                    />
                  ) : (
                    <Typography sx={{ color: "text.disabled", fontSize: 10, fontWeight: 700 }}>
                      {member.rank}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    alignItems: "center",
                    background: member.gradient,
                    borderRadius: "50%",
                    color: "#fff",
                    display: "flex",
                    flexShrink: 0,
                    fontSize: 9,
                    fontWeight: 700,
                    height: 26,
                    justifyContent: "center",
                    width: 26,
                  }}
                >
                  {member.initials}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 11, fontWeight: 700 }}>
                    {member.name}
                  </Typography>
                  <Typography sx={{ color: "text.disabled", fontSize: 9 }}>{member.role}</Typography>
                </Box>
                <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
                  {[
                    { value: member.leads, label: "Leads", color: "primary.main" },
                    { value: member.enrolled, label: "Enrolled", color: "success.main" },
                    { value: member.conv, label: "Conv.", color: "secondary.main" },
                  ].map((stat) => (
                    <Box key={stat.label} sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: stat.color, fontSize: 12, fontWeight: 800 }}>{stat.value}</Typography>
                      <Typography sx={{ color: "text.disabled", fontSize: 8 }}>{stat.label}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ flexShrink: 0, width: 46 }}>
                  <Typography sx={{ color: "text.disabled", fontSize: 8 }}>Target</Typography>
                  <Box sx={{ bgcolor: "#F1F5F9", borderRadius: 0.5, height: 4, mt: 0.375, overflow: "hidden" }}>
                    <Box
                      sx={{
                        background: "linear-gradient(90deg, #007A87, #15A6B8)",
                        borderRadius: 0.5,
                        height: "100%",
                        width: `${member.target}%`,
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            ))}
          </Box>
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard title="WhatsApp This Period">
          <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "1fr 1fr" }}>
            {[
              { value: "2,940", label: "Total Sent", bg: "#F0F9FA", color: "primary.main" },
              { value: "96.2%", label: "Delivered", bg: "#FFF7ED", color: "secondary.main" },
              { value: "74%", label: "Read Rate", bg: "#F0FDF4", color: "success.main" },
              { value: "12", label: "Failed", bg: "#FEF2F2", color: "error.main" },
            ].map((cell) => (
              <Box key={cell.label} sx={{ bgcolor: cell.bg, borderRadius: 2, p: "7px 9px" }}>
                <Typography sx={{ color: cell.color, fontSize: 15, fontWeight: 800 }}>{cell.value}</Typography>
                <Typography sx={{ color: "text.disabled", fontSize: 9, mt: 0.125 }}>{cell.label}</Typography>
              </Box>
            ))}
          </Box>
        </PanelCard>

        <PanelCard grow title="Enrolled by Counsellor">
          <Box
            sx={{
              alignItems: "end",
              display: "flex",
              flex: 1,
              gap: 1,
              justifyContent: "space-around",
              minHeight: 140,
              pb: 1,
            }}
          >
            {[
              { label: "Anjali", enrolled: 12, progress: 16 },
              { label: "Meena", enrolled: 9, progress: 13 },
              { label: "Ravi", enrolled: 6, progress: 11 },
              { label: "Suresh", enrolled: 4, progress: 8 },
              { label: "Nisha", enrolled: 2, progress: 7 },
            ].map((bar) => (
              <Stack key={bar.label} spacing={0.5} sx={{ alignItems: "center", flex: 1 }}>
                <Stack direction="row" spacing={0.25} sx={{ alignItems: "end", height: 100 }}>
                  <Box
                    sx={{
                      bgcolor: "rgba(0,122,135,.82)",
                      borderRadius: "5px 5px 0 0",
                      height: `${(bar.enrolled / 12) * 100}%`,
                      minHeight: 8,
                      width: 10,
                    }}
                  />
                  <Box
                    sx={{
                      bgcolor: "rgba(245,130,13,.55)",
                      borderRadius: "5px 5px 0 0",
                      height: `${(bar.progress / 16) * 100}%`,
                      minHeight: 8,
                      width: 10,
                    }}
                  />
                </Stack>
                <Typography sx={{ color: "text.secondary", fontSize: 9 }}>{bar.label}</Typography>
              </Stack>
            ))}
          </Box>
        </PanelCard>
      </Stack>
    </Stack>
  );
}
