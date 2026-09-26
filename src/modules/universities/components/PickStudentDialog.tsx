import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { studentsApi, type StudentOption } from "@/modules/applications/studentsApi";

/**
 * Picks the student an action applies to.
 *
 * Shortlisting and sharing are both "do this for a student", and neither means anything
 * until one is chosen. The course detail page had buttons for both with no handler at
 * all, so they looked available and did nothing.
 *
 * Type-ahead rather than a dropdown: a counsellor knows the name, and a tenant with two
 * hundred students makes a list unusable. Matching covers email and phone too, because
 * two students often share a first name and the email is what tells them apart.
 */
type PickStudentDialogProps = {
  open: boolean;
  /** Shown in the title, e.g. "Add MSc Data Science to a shortlist". */
  title: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (student: StudentOption) => void;
};

export function PickStudentDialog({
  open,
  title,
  confirmLabel,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}: PickStudentDialogProps) {
  const [selected, setSelected] = useState<StudentOption | null>(null);

  const {
    data: students = [],
    isLoading,
    isError,
  } = useQuery({
    // Only while the dialog is open — no reason to hold every student in memory behind
    // a button nobody has pressed.
    enabled: open,
    queryKey: ["students", "options"],
    queryFn: () => studentsApi.getStudents(),
  });

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={busy ? undefined : close}>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>{title}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          {isError ? (
            <Alert severity="error">Could not load your students. Try again in a moment.</Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Autocomplete
            autoHighlight
            disabled={busy}
            loading={isLoading}
            options={students}
            value={selected}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
            // The label alone is the name, so the list reads cleanly once a student is
            // picked — but the match has to see the email, or two Priyas are the same row.
            filterOptions={(options, { inputValue }) => {
              const needle = inputValue.trim().toLowerCase();
              if (!needle) return options;
              return options.filter((option) =>
                `${option.name} ${option.email} ${option.phone}`.toLowerCase().includes(needle),
              );
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack>
                  <Typography sx={{ fontSize: 13 }}>{option.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                    {option.email || option.phone || "no contact details"}
                  </Typography>
                </Stack>
              </li>
            )}
            onChange={(_event, value) => setSelected(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                required
                helperText={
                  students.length === 0 && !isLoading
                    ? "You have no students yet — add one first."
                    : "Search by name, email or phone."
                }
                label="Student"
                size="small"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button disabled={busy} sx={{ textTransform: "none" }} onClick={close}>
          Cancel
        </Button>
        <Button
          // Nothing to confirm without a student, so the button says so by being off.
          disabled={!selected || busy}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={() => selected && onConfirm(selected)}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
