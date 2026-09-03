import { useEffect, useState } from "react";
import { Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import { DialogModal } from "@/shared/components/DialogModal";

type CatalogEntity = "course" | "university";

type CatalogDeleteDialogProps = {
  entity: CatalogEntity;
  /** Name of the record being removed; null closes the dialog. */
  name: string | null;
  onClose: () => void;
  onConfirm: (purge: boolean) => Promise<void> | void;
  submitting?: boolean;
};

/**
 * Shared confirm step for removing a catalog record. Archive is the default: the row is
 * kept so anything already pointing at it survives, and it can be restored. A permanent
 * delete is opt-in, and the backend still refuses it (409) while anything is linked.
 */
const COPY: Record<CatalogEntity, { title: string; archive: string; purge: string; button: string }> = {
  course: {
    title: "Remove course",
    archive:
      "Archiving hides the course from search and listings but keeps it on any student shortlist that already references it, so it can be restored later.",
    purge: "Delete permanently instead (only possible when no student is linked to it)",
    button: "Archive course",
  },
  university: {
    title: "Remove university",
    archive:
      "Archiving hides the university and its courses from search and listings. Nothing is deleted — applications and shortlists are untouched — and it can be restored later.",
    purge:
      "Delete permanently instead, along with its courses (only possible when nothing is linked to it)",
    button: "Archive university",
  },
};

export function CatalogDeleteDialog({
  entity,
  name,
  onClose,
  onConfirm,
  submitting = false,
}: CatalogDeleteDialogProps) {
  const [purge, setPurge] = useState(false);
  const copy = COPY[entity];

  useEffect(() => {
    if (name) {
      setPurge(false);
    }
  }, [name]);

  return (
    <DialogModal
      maxWidth="xs"
      open={Boolean(name)}
      title={copy.title}
      onClose={onClose}
      actions={
        <>
          <Button disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={submitting}
            variant="contained"
            onClick={() => onConfirm(purge)}
          >
            {purge ? "Delete permanently" : copy.button}
          </Button>
        </>
      }
    >
      <Stack spacing={1.5}>
        <Typography sx={{ fontSize: 14 }}>
          Remove <strong>{name}</strong> from the catalog?
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {copy.archive}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={purge}
              size="small"
              onChange={(event) => setPurge(event.target.checked)}
            />
          }
          label={<Typography sx={{ fontSize: 13 }}>{copy.purge}</Typography>}
        />
      </Stack>
    </DialogModal>
  );
}
