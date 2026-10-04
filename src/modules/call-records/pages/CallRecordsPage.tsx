import { useNavigate } from "react-router-dom";
import { Button, Stack } from "@mui/material";
import { SettingsPageHeader } from "@/modules/settings/components/SettingsPageHeader";
import { CallSummaryCards } from "@/modules/call-records/components/CallSummaryCards";
import { callRecordsDetailsPath } from "@/modules/call-records/callRecordsRoutePaths";

/** The Call Records landing page: the summary cards. The calls themselves live on the details page. */
export function CallRecordsPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={3}>
      <SettingsPageHeader
        actions={
          <Button size="small" sx={{ textTransform: "none" }} variant="outlined" onClick={() => navigate(callRecordsDetailsPath())}>
            All calls
          </Button>
        }
        eyebrow="Call Records"
        title="VuTrak"
      />

      <CallSummaryCards onOpen={(period, direction) => navigate(callRecordsDetailsPath({ period, direction }))} />
    </Stack>
  );
}
