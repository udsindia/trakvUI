import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
} from "@mui/material";
import {
  RequirementsEditor,
  aptitudeKey,
  englishKey,
} from "@/modules/universities/components/RequirementsEditor";
import {
  emptyRequirementSet,
  requirementSetIsEmpty,
  type RequirementSet,
} from "@/modules/universities/universitiesCatalogService";

type UniversityDefaultsDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Defaults already stored for this university, used to seed the editor. */
  initial?: RequirementSet;
  /** Courses that exist today — the target of the "apply to existing" checkbox. */
  existingCourseIds: string[];
  onSave: (set: RequirementSet, applyToCourseIds: string[]) => Promise<void>;
};

/**
 * Edits the requirement defaults held against a university (course_id = NULL).
 *
 * These act as a template: the course form copies them into each new course, which
 * then owns its copy. Changing the defaults therefore does NOT reach courses that
 * already exist — the checkbox below is the explicit way to push them out.
 */
export function UniversityDefaultsDialog({
  open,
  onClose,
  initial,
  existingCourseIds,
  onSave,
}: UniversityDefaultsDialogProps) {
  const [set, setSet] = useState<RequirementSet>(emptyRequirementSet());
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSet(initial ? structuredClone(initial) : emptyRequirementSet());
    setApplyToExisting(false);
    setError(null);
  }, [open, initial]);

  // Anything that arrived from storage can be changed but not removed — the save has
  // create and modify, no delete. Locking these keeps the buttons honest.
  const lockedKeys = [
    ...(initial?.languageTests ?? []).map((test) => englishKey(test.testType)),
    ...(initial?.aptitudeTests ?? []).map((test) => aptitudeKey(test.testType)),
  ];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(set, applyToExisting ? existingCourseIds : []);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save the requirements.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Default requirements for this university</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            These are used to prefill the form when a course is added, so common
            requirements only need typing once. Each course keeps its own copy — editing
            these defaults later will not change courses that already exist, unless you
            tick the box below. Saved requirements can be changed or added to, but not
            removed.
          </Alert>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {saving ? <LinearProgress /> : null}

          <RequirementsEditor lockedKeys={lockedKeys} value={set} onChange={setSet} />

          {existingCourseIds.length > 0 ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyToExisting}
                  onChange={(event) => setApplyToExisting(event.target.checked)}
                />
              }
              label={`Also apply these to the ${existingCourseIds.length} course${
                existingCourseIds.length === 1 ? "" : "s"
              } that already exist`}
            />
          ) : null}
          {applyToExisting ? (
            <Alert severity="warning">
              Where a course already requires the same test, its stored value is
              overwritten with the one above. Requirements those courses have that
              aren&apos;t listed here are left alone — nothing is removed.
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          disabled={saving || requirementSetIsEmpty(set)}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={handleSave}
        >
          Save defaults
        </Button>
      </DialogActions>
    </Dialog>
  );
}
