import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { StudentProfileFields } from "@/modules/students/components/StudentProfileFields";
import {
  studentsApi,
  type BackendStudentDetail,
  type UpdateStudentPayload,
} from "@/modules/students/studentsApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type EditStudentDialogProps = {
  open: boolean;
  student: BackendStudentDetail;
  onClose: () => void;
};

/** Only the fields this form owns — everything else on the record is left alone. */
const seed = (student: BackendStudentDetail): UpdateStudentPayload => ({
  dateOfBirth: student.dateOfBirth ?? null,
  nationality: student.nationality ?? null,
  passportExpiryDate: student.passportExpiryDate ?? null,
  passportIssueCountry: student.passportIssueCountry ?? null,
  highestDegree: student.highestDegree ?? null,
  institutionName: student.institutionName ?? null,
  fieldOfStudy: student.fieldOfStudy ?? null,
  graduationYear: student.graduationYear ?? null,
  academicScore: student.academicScore ?? null,
  scoreType: student.scoreType ?? null,
  workExperienceMonths: student.workExperienceMonths ?? null,
});

/**
 * Edits a student's profile.
 *
 * Name, email and phone are deliberately absent: they are mirrored from the lead on every
 * lead update, so editing them here would be silently undone the next time anybody touched
 * the lead. They are corrected on the lead, which is where they live.
 */
export function EditStudentDialog({ open, student, onClose }: EditStudentDialogProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<UpdateStudentPayload>(() => seed(student));

  // Reseeded on open, so cancelling and reopening shows what is stored rather than the
  // edits that were abandoned.
  useEffect(() => {
    if (open) setDraft(seed(student));
  }, [open, student]);

  const save = useMutation({
    mutationFn: () => studentsApi.updateStudent(student.id, draft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      await queryClient.invalidateQueries({ queryKey: ["student", student.id] });
      onClose();
    },
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={save.isPending ? undefined : onClose}>
      <DialogTitle>Edit student</DialogTitle>
      <DialogContent>
        {save.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {getApiErrorMessage(save.error, "Unable to save the student.")}
          </Alert>
        ) : null}
        <StudentProfileFields
          disabled={save.isPending}
          value={draft}
          onChange={setDraft}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={save.isPending} sx={{ textTransform: "none" }} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={save.isPending}
          sx={{ textTransform: "none" }}
          variant="contained"
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
