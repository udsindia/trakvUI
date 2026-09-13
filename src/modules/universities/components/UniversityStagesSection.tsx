import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, FormControlLabel, Switch, Typography } from "@mui/material";
import {
  StageSequenceEditor,
  toDraftStages,
  type DraftStage,
} from "@/modules/settings/components/StageSequenceEditor";
import { stageTemplatesApi } from "@/modules/settings/stageTemplatesApi";

type UniversityStagesSectionProps = {
  countryCode: string;
  customise: boolean;
  onCustomiseChange: (customise: boolean) => void;
  stages: DraftStage[];
  onStagesChange: (stages: DraftStage[]) => void;
};

/**
 * The application stage sequence, shown while adding a university.
 *
 * Its own file, and loaded lazily by the drawer, because the drawer is shared with the
 * super-admin portal and the university detail page. Imported directly, this pulled the
 * settings module's stage code into the chunk every page loads — 92kB on first paint for
 * a panel most people never open.
 */
export function UniversityStagesSection({
  countryCode,
  customise,
  onCustomiseChange,
  stages,
  onStagesChange,
}: UniversityStagesSectionProps) {
  // What this university would inherit, asked of the server rather than assembled here, so
  // the drawer shows the sequence an application would really be created with.
  const { data: inherited } = useQuery({
    enabled: Boolean(countryCode),
    queryKey: ["stage-templates", "inherited", countryCode],
    queryFn: () => stageTemplatesApi.get(countryCode),
  });

  // Seeded from what is inherited, so customising starts from the real sequence rather
  // than an empty list somebody has to retype.
  useEffect(() => {
    if (customise && inherited && stages.length === 0) {
      onStagesChange(toDraftStages(inherited.stages));
    }
  }, [customise, inherited]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!countryCode) {
    return (
      <Typography color="text.secondary" variant="body2">
        Choose a country to see the stages applications here will follow.
      </Typography>
    );
  }

  const countryName = inherited?.countryName ?? countryCode;

  return (
    <>
      <Alert severity="info" sx={{ py: 0.5 }}>
        Applications for this university will follow <strong>{countryName}</strong>&rsquo;s
        sequence{inherited ? ` — ${inherited.stages.length} stages` : ""}.
      </Alert>

      <FormControlLabel
        control={
          <Switch
            checked={customise}
            size="small"
            onChange={(event) => onCustomiseChange(event.target.checked)}
          />
        }
        label={<Typography variant="body2">Give this university its own stages</Typography>}
      />

      {customise ? (
        <>
          <Typography color="text.secondary" variant="caption">
            Starts from the inherited sequence. Once saved, later changes to {countryName} will
            not reach this university.
          </Typography>
          <Box>
            <StageSequenceEditor stages={stages} onChange={onStagesChange} />
          </Box>
        </>
      ) : null}
    </>
  );
}
