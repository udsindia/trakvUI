import { Link as RouterLink } from "react-router-dom";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import {
  universitiesRoutePaths,
  universityDetailsPath,
} from "@/modules/universities/universitiesRoutePaths";

type UniversitiesBreadcrumbProps = {
  universityName?: string;
  universityId?: string;
  courseName?: string;
};

export function UniversitiesBreadcrumb({
  universityName,
  universityId,
  courseName,
}: UniversitiesBreadcrumbProps) {
  return (
    <Breadcrumbs
      separator="›"
      sx={{
        "& .MuiBreadcrumbs-separator": { color: "text.disabled", mx: 0.75 },
        fontSize: 12,
      }}
    >
      <Link
        component={RouterLink}
        sx={{ color: "text.secondary", fontSize: 12, textDecoration: "none", "&:hover": { color: "text.primary" } }}
        to={universitiesRoutePaths.search}
        underline="hover"
      >
        Courses
      </Link>
      {universityName && universityId ? (
        courseName ? (
          <Link
            component={RouterLink}
            sx={{ color: "text.secondary", fontSize: 12, textDecoration: "none", "&:hover": { color: "text.primary" } }}
            to={universityDetailsPath(universityId)}
            underline="hover"
          >
            {universityName}
          </Link>
        ) : (
          <Typography color="text.primary" sx={{ fontSize: 12, fontWeight: 600 }}>
            {universityName}
          </Typography>
        )
      ) : null}
      {courseName ? (
        <Typography color="text.primary" sx={{ fontSize: 12, fontWeight: 600 }}>
          {courseName}
        </Typography>
      ) : null}
    </Breadcrumbs>
  );
}

type DetailPageHeaderProps = {
  breadcrumb: UniversitiesBreadcrumbProps;
  actions?: React.ReactNode;
};

export function DetailPageHeader({ breadcrumb, actions }: DetailPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        alignItems: { md: "center" },
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        bgcolor: "background.paper",
        justifyContent: "space-between",
        minHeight: 50,
        px: 2.75,
        py: 1.25,
      }}
    >
      <UniversitiesBreadcrumb {...breadcrumb} />
      {actions ? <Stack direction="row" spacing={1}>{actions}</Stack> : null}
    </Stack>
  );
}
