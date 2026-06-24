import { Alert, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { SuperAdminPageHeader } from "@/modules/super-admin/components/SuperAdminPageHeader";

const PERMISSION_CATEGORIES = [
  "Lead Management",
  "Student Management",
  "Visa Processing",
  "Documents",
  "Payments",
  "Reports",
  "Settings",
];

const DEFAULT_TEMPLATES = [
  { name: "Agency Admin", permissions: "Full access within tenant" },
  { name: "Counsellor", permissions: "Leads, students, applications (view/create)" },
  { name: "Application Manager", permissions: "Applications lifecycle management" },
  { name: "Activity Manager", permissions: "Tasks and activity coordination" },
  { name: "Analyst", permissions: "Read-only dashboards and reports" },
];

export function RoleTemplatesPage() {
  return (
    <Stack spacing={3}>
      <SuperAdminPageHeader
        eyebrow="Platform · Roles"
        subtitle="Define master permission categories and default role templates that agency admins can assign."
        title="Global Role Templates"
      />

      <Alert severity="info">
        Full CRUD for permission categories, codes, and templates will be wired to the backend roles API
        in the next iteration.
      </Alert>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="h6">
            Permission Categories
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {PERMISSION_CATEGORIES.map((category) => (
              <Chip key={category} label={category} variant="outlined" />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="h6">
            Default Role Templates
          </Typography>
          <Stack spacing={1.5}>
            {DEFAULT_TEMPLATES.map((template) => (
              <Stack
                key={template.name}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}
              >
                <Typography sx={{ fontWeight: 700 }}>{template.name}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {template.permissions}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
