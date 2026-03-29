import type { ReactNode } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

type FeedbackStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
};

export function FeedbackState({
  eyebrow,
  title,
  description,
  footer,
}: FeedbackStateProps) {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "calc(100vh - 64px)",
        placeItems: "center",
        px: 3,
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          maxWidth: 720,
          p: 5,
          width: "100%",
        }}
      >
        <Stack spacing={2}>
          <Typography color="primary.main" variant="overline">
            {eyebrow}
          </Typography>
          <Typography variant="h4">{title}</Typography>
          <Typography color="text.secondary" variant="body1">
            {description}
          </Typography>
          {footer}
        </Stack>
      </Paper>
    </Box>
  );
}

