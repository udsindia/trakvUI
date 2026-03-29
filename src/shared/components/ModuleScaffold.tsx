import { Chip, Paper, Stack, Typography } from "@mui/material";

type ModuleScaffoldProps = {
  title: string;
  description: string;
  capabilities: string[];
};

export function ModuleScaffold({
  title,
  description,
  capabilities,
}: ModuleScaffoldProps) {
  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: 4,
        }}
      >
        <Stack spacing={2}>
          <Typography color="primary.main" variant="overline">
            Module Shell
          </Typography>
          <Typography variant="h4">{title}</Typography>
          <Typography color="text.secondary" variant="body1">
            {description}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: 4,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6">Prepared for Expansion</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {capabilities.map((capability) => (
              <Chip key={capability} label={capability} variant="outlined" />
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

