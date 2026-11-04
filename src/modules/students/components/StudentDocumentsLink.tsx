import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import FolderOpenRounded from "@mui/icons-material/FolderOpenRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { studentsApi } from "@/modules/students/studentsApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type StudentDocumentsLinkProps = {
  studentId: string;
  documentsUrl?: string | null;
  /** STUDENT_DOCS: may set or change the link. Anyone who can see the student can open it. */
  canManage: boolean;
};

const isWebLink = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

/**
 * A link to the student's documents folder in the agency's own storage (Google Drive,
 * OneDrive, Dropbox). VUTrak keeps the link, not the files, so the folder's own sharing
 * settings still decide who can open what is inside.
 */
export function StudentDocumentsLink({ studentId, documentsUrl, canManage }: StudentDocumentsLinkProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(documentsUrl ?? "");

  const save = useMutation({
    mutationFn: (url: string) => studentsApi.updateStudent(studentId, { documentsUrl: url.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setOpen(false);
    },
  });

  const openDialog = () => {
    setValue(documentsUrl ?? "");
    save.reset();
    setOpen(true);
  };

  const trimmed = value.trim();
  const invalid = trimmed !== "" && !isWebLink(trimmed);

  return (
    <>
      {documentsUrl ? (
        <Button
          component="a"
          href={documentsUrl}
          rel="noopener noreferrer"
          startIcon={<FolderOpenRounded />}
          target="_blank"
          variant="outlined"
        >
          Documents
        </Button>
      ) : canManage ? (
        <Button startIcon={<FolderOpenRounded />} variant="outlined" onClick={openDialog}>
          Add documents link
        </Button>
      ) : null}

      {documentsUrl && canManage ? (
        <Tooltip title="Change the documents link">
          <IconButton aria-label="Change the documents link" onClick={openDialog}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}

      <Dialog fullWidth maxWidth="sm" open={open} onClose={save.isPending ? undefined : () => setOpen(false)}>
        <DialogTitle>Documents link</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Paste the link to this student&apos;s folder in Google Drive, OneDrive or Dropbox. Make
            sure the folder is shared with your team, because the link opens it with that
            folder&apos;s own permissions.
          </DialogContentText>
          {save.isError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getApiErrorMessage(save.error, "Could not save the link.")}
            </Alert>
          ) : null}
          <TextField
            autoFocus
            fullWidth
            error={invalid}
            helperText={invalid ? "Enter a web address starting with https://" : "Leave empty to remove the link."}
            label="Folder link"
            placeholder="https://drive.google.com/drive/folders/…"
            size="small"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={save.isPending} sx={{ textTransform: "none" }} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalid || save.isPending || trimmed === (documentsUrl ?? "")}
            sx={{ textTransform: "none" }}
            variant="contained"
            onClick={() => save.mutate(value)}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
