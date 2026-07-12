import SchoolRounded from "@mui/icons-material/SchoolRounded";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import type { University } from "@/modules/universities/universities.types";
import { tagChipSx } from "@/modules/universities/universitiesStyles";

type UniversityHeroProps = {
  university: University;
  courseCount: number;
};

export function UniversityHero({ university, courseCount }: UniversityHeroProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "#edf2f7",
        px: { xs: 2.5, md: 3 },
        py: 2.5,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "center" } }}
      >
        <Stack direction="row" spacing={1.75} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <Avatar
            sx={{
              bgcolor: (theme) => `${theme.palette.secondary.main}18`,
              color: "secondary.main",
              height: 52,
              width: 52,
            }}
            variant="rounded"
          >
            <SchoolRounded />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, lineHeight: 1.2 }}>
              {university.name}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.75 }}>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {university.flag} {university.city}, {university.country}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                Founded {university.founded}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {university.website}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {university.qsRank ? (
            <Chip label={`QS #${university.qsRank}`} size="small" sx={tagChipSx} />
          ) : null}
          <Chip label={`${courseCount} courses`} size="small" sx={tagChipSx} />
          <Chip
            label={`${university.trackRecord.studentsEnrolled} students`}
            size="small"
            sx={tagChipSx}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
