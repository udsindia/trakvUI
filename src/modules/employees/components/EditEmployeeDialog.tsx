import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import type { EmployeeDeviceRow } from "@/modules/employees/employees.types";

type EditEmployeeDialogProps = {
  employee: EmployeeDeviceRow | null;
  saving: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (values: { employeeCode: string; tags: string[] }) => void;
};

/** Settings → Employees: edit the employee code and tags for one row. */
export function EditEmployeeDialog({ employee, saving, error, onCancel, onSave }: EditEmployeeDialogProps) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (employee) {
      setEmployeeCode(employee.employeeCode);
      setTags(employee.tags);
      setTagDraft("");
    }
  }, [employee]);

  const addTag = () => {
    const value = tagDraft.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagDraft("");
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={Boolean(employee)} onClose={saving ? undefined : onCancel}>
      <DialogTitle sx={{ pb: 1 }}>Edit {employee?.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Employee Code"
            size="small"
            value={employeeCode}
            onChange={(event) => setEmployeeCode(event.target.value)}
          />

          <Stack spacing={1}>
            <Typography color="text.secondary" variant="caption">
              Tags
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {tags.map((tag) => (
                <Chip
                  deleteIcon={<CloseRounded sx={{ fontSize: 14 }} />}
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(tags.filter((t) => t !== tag))}
                />
              ))}
            </Stack>
            <TextField
              placeholder="Add a tag and press Enter"
              size="small"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={saving}
          variant="contained"
          onClick={() => onSave({ employeeCode: employeeCode.trim(), tags })}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
