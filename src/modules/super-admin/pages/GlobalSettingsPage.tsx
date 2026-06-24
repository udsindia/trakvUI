import { Alert, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";

const SETTING_SECTIONS = [
  { title: "SMTP", description: "Outbound email relay and sender identity." },
  { title: "WhatsApp API", description: "Business messaging credentials and webhooks." },
  { title: "SMS Gateway", description: "Transactional SMS provider configuration." },
  { title: "Payment Gateway", description: "Razorpay / Stripe keys and webhook endpoints." },
  { title: "Storage Provider", description: "S3-compatible object storage for documents." },
  { title: "Theme Configuration", description: "Platform branding, colors, and typography defaults." },
];

export function GlobalSettingsPage() {
  return (
    <Stack spacing={3}>
      <SuperAdminPageHeader
        eyebrow="Platform · Settings"
        subtitle="Platform-wide configuration for integrations, gateways, and branding."
        title="Global Settings"
      />

      <Alert severity="info">
        Configuration forms will connect to the platform settings API once backend endpoints are available.
      </Alert>

      <Grid container spacing={2}>
        {SETTING_SECTIONS.map((section) => (
          <Grid key={section.title} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }} variant="h6">
                  {section.title}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {section.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
