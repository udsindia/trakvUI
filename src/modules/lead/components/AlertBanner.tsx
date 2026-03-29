import { Alert, AlertTitle, Typography } from "@mui/material";

type AlertBannerProps = {
  description?: string;
  severity?: "error" | "info" | "success" | "warning";
  title?: string;
};

export function AlertBanner({
  description = "Potential duplicate lead warnings will appear here once duplicate detection is connected.",
  severity = "warning",
  title = "Duplicate check placeholder",
}: AlertBannerProps) {
  return (
    <Alert
      severity={severity}
      variant="outlined"
      sx={{
        alignItems: "flex-start",
        borderRadius: 3,
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
    >
      <AlertTitle sx={{ mb: 0.5 }}>{title}</AlertTitle>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Alert>
  );
}
