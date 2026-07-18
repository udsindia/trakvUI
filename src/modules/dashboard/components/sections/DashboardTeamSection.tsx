import { Box, Stack, Typography } from "@mui/material";
import { PanelCard, PanelLink } from "@/modules/dashboard/components/PanelCard";

function ComingSoon({ message }: { message: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", minHeight: 100 }}>
      <Typography sx={{ color: "text.disabled", fontSize: 12, textAlign: "center" }}>{message}</Typography>
    </Box>
  );
}

export function DashboardTeamSection() {
  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
      <Stack sx={{ flex: 6, minHeight: 0, minWidth: 0 }}>
        <PanelCard action={<PanelLink>Full report →</PanelLink>} grow title="Team Performance">
          <ComingSoon message={"Team performance metrics\ncoming soon"} />
        </PanelCard>
      </Stack>

      <Stack spacing={1} sx={{ flex: 4, minHeight: 0, minWidth: 0 }}>
        <PanelCard title="WhatsApp This Period">
          <ComingSoon message={"WhatsApp analytics\ncoming soon"} />
        </PanelCard>

        <PanelCard grow title="Enrolled by Counsellor">
          <ComingSoon message={"Enrolment chart\ncoming soon"} />
        </PanelCard>
      </Stack>
    </Stack>
  );
}
