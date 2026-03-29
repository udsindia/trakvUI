import { Box, CircularProgress, Stack, Typography } from "@mui/material";

type LoadingScreenProps = {
  description?: string;
  fullHeight?: boolean;
  title?: string;
};

export function LoadingScreen({
  description,
  fullHeight = false,
  title,
}: LoadingScreenProps) {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: fullHeight ? "100vh" : "50vh",
        placeItems: "center",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center", maxWidth: 420, textAlign: "center" }}>
        <CircularProgress />
        {title ? <Typography variant="h6">{title}</Typography> : null}
        {description ? (
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
