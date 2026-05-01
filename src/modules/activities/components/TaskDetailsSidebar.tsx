import { useEffect, useState } from "react";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import type { BoardTask } from "@/modules/activities/types/types";

type TaskDetailsSidebarProps = {
  isCancellingTask?: boolean;
  isCompletingTask?: boolean;
  isLoading?: boolean;
  isReschedulingTask?: boolean;
  isStartingTask?: boolean;
  open: boolean;
  submitErrorMessage?: string | null;
  task: BoardTask | null;
  onCancelTask: (input: {
    reason: string;
    taskId: string;
  }) => Promise<void> | void;
  onClose: () => void;
  onMarkComplete: (input: {
    completionNote: string;
    taskId: string;
  }) => Promise<void> | void;
  onMarkInProgress: (taskId: string) => Promise<void> | void;
  onRescheduleTask: (input: {
    assignedToId?: string | null;
    newDueDate: string;
    reason: string;
    taskId: string;
  }) => Promise<void> | void;
};

type TaskActionKey = "reschedule" | "complete" | "cancel" | null;

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatReadableDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPriority(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getActionTitle(action: Exclude<TaskActionKey, null>) {
  switch (action) {
    case "reschedule":
      return "Reschedule task";
    case "complete":
      return "Complete task";
    case "cancel":
      return "Cancel task";
    default:
      return "";
  }
}

export function TaskDetailsSidebar({
  isCancellingTask = false,
  isCompletingTask = false,
  isLoading = false,
  isReschedulingTask = false,
  isStartingTask = false,
  open,
  submitErrorMessage,
  task,
  onCancelTask,
  onClose,
  onMarkComplete,
  onMarkInProgress,
  onRescheduleTask,
}: TaskDetailsSidebarProps) {
  const [completionNote, setCompletionNote] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [activeAction, setActiveAction] = useState<TaskActionKey>(null);
  const isActionPending =
    isCancellingTask || isCompletingTask || isReschedulingTask || isStartingTask;
  const isClosedTask = task?.status === "DONE" || task?.status === "CANCELLED";

  useEffect(() => {
    if (!task) return;
    setCompletionNote("");
    setCompletionError("");
    setCancelReason("");
    setCancelError("");
    setNewDueDate(task.dueDate.slice(0, 10));
    setRescheduleReason("");
    setRescheduleError("");
    setActiveAction(null);
  }, [task]);

  const handleMarkComplete = async () => {
    if (!task) return;

    const trimmedCompletionNote = completionNote.trim();

    if (trimmedCompletionNote.length < 10) {
      setCompletionError("Completion note must be at least 10 characters.");
      return;
    }

    await onMarkComplete({
      completionNote: trimmedCompletionNote,
      taskId: task.id,
    });
  };

  const handleMarkInProgress = async () => {
    if (!task) return;
    await onMarkInProgress(task.id);
  };

  const handleReschedule = async () => {
    if (!task) return;

    const trimmedReason = rescheduleReason.trim();
    const parsedDate = new Date(`${newDueDate}T00:00:00`);

    if (!newDueDate || Number.isNaN(parsedDate.getTime())) {
      setRescheduleError("Enter a valid new due date.");
      return;
    }

    if (trimmedReason.length < 5) {
      setRescheduleError("Reschedule reason must be at least 5 characters.");
      return;
    }

    await onRescheduleTask({
      newDueDate,
      reason: trimmedReason,
      taskId: task.id,
    });
    setRescheduleReason("");
    setRescheduleError("");
    setActiveAction(null);
  };

  const handleCancel = async () => {
    if (!task) return;

    const trimmedReason = cancelReason.trim();

    if (trimmedReason.length < 5) {
      setCancelError("Cancellation reason must be at least 5 characters.");
      return;
    }

    await onCancelTask({
      reason: trimmedReason,
      taskId: task.id,
    });
  };

  const dismissActionPanel = () => {
    setActiveAction(null);
    setCompletionError("");
    setCancelError("");
    setRescheduleError("");
  };

  return (
    <Drawer
      anchor="right"
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            top: `${NAVBAR_HEIGHT}px`,
            width: { xs: "100%", sm: 460 },
          },
        },
      }}
      open={open}
      onClose={onClose}
    >
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
            flex: "0 0 auto",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
          }}
        >
          <Typography sx={{ fontWeight: 700 }} variant="h6">
            Task Details
          </Typography>
          <Tooltip title="Close task details">
            <IconButton aria-label="Close task details" onClick={onClose}>
              <CloseRounded />
            </IconButton>
          </Tooltip>
        </Stack>

        {task ? (
          <>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3, py: 3 }}>
              {isLoading ? (
                <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 240 }}>
                  <CircularProgress size={28} />
                </Stack>
              ) : (
                <Stack spacing={3}>
                  {submitErrorMessage ? <Alert severity="error">{submitErrorMessage}</Alert> : null}

                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700 }} variant="h6">
                      {task.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {task.description}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Chip label={formatPriority(task.priority)} size="small" />
                    {task.status ? <Chip label={task.status} size="small" variant="outlined" /> : null}
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <CalendarMonthRounded color="action" fontSize="small" />
                    <Typography color="text.secondary" variant="body2">
                      Due {formatReadableDate(task.dueDate)}
                    </Typography>
                  </Stack>

                  <Stack spacing={1.25}>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      Assigned Agent
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        p: 2,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar src={task.assignedAgent.avatarUrl}>
                          {getInitials(task.assignedAgent.name)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }} variant="body2">
                            {task.assignedAgent.name}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {task.assignedAgent.role}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>

                  <Stack spacing={1.25}>
                    <Typography sx={{ fontWeight: 600 }} variant="body2">
                      Linked Lead
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        p: 2,
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
                        >
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Avatar src={task.linkedLead.avatarUrl}>
                              {getInitials(task.linkedLead.name)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700 }} variant="body2">
                                {task.linkedLead.name}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                {task.linkedLead.details}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>

                        {task.linkedLead.email || task.linkedLead.phone ? (
                          <Stack spacing={0.75}>
                            {task.linkedLead.email ? (
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <EmailOutlined color="action" fontSize="small" />
                                <Typography color="text.secondary" variant="body2">
                                  {task.linkedLead.email}
                                </Typography>
                              </Stack>
                            ) : null}
                            {task.linkedLead.phone ? (
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <PhoneOutlined color="action" fontSize="small" />
                                <Typography color="text.secondary" variant="body2">
                                  {task.linkedLead.phone}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Stack>
                        ) : null}
                      </Stack>
                    </Paper>
                  </Stack>

                  {task.notes.length ? (
                    <Stack spacing={1.25}>
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        Notes
                      </Typography>
                      <Stack spacing={1.25} sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
                        {task.notes.map((note) => (
                          <Paper
                            key={note.id}
                            elevation={0}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 3,
                              p: 1.5,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700 }} variant="body2">
                              {note.author}
                            </Typography>
                            <Typography color="text.secondary" variant="caption">
                              {note.timeAgo}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                              {note.content}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  ) : null}

                </Stack>
              )}
            </Box>

            <Divider />

            <Box sx={{ bgcolor: "background.paper", px: 3, py: 2 }}>
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    "& > button": {
                      flex: 1,
                      minWidth: 0,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  {task.status === "PENDING" ? (
                    <Button disabled={isActionPending} variant="outlined" onClick={handleMarkInProgress}>
                      {isStartingTask ? <CircularProgress color="inherit" size={18} /> : "Start"}
                    </Button>
                  ) : null}
                  <Button
                    disabled={isActionPending || isClosedTask}
                    variant={activeAction === "reschedule" ? "contained" : "outlined"}
                    onClick={() =>
                      setActiveAction((current) => (current === "reschedule" ? null : "reschedule"))
                    }
                  >
                    Reschedule
                  </Button>
                  <Button
                    disabled={isActionPending || isClosedTask}
                    variant={activeAction === "complete" ? "contained" : "outlined"}
                    onClick={() =>
                      setActiveAction((current) => (current === "complete" ? null : "complete"))
                    }
                  >
                    Complete
                  </Button>
                  <Button
                    color="error"
                    disabled={isActionPending || isClosedTask}
                    variant={activeAction === "cancel" ? "contained" : "outlined"}
                    onClick={() =>
                      setActiveAction((current) => (current === "cancel" ? null : "cancel"))
                    }
                  >
                    Cancel Task
                  </Button>
                </Stack>

                {activeAction ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      borderTop: "1px solid",
                      borderColor: "divider",
                      justifyContent: "space-between",
                      pt: 1.25,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {getActionTitle(activeAction)}
                    </Typography>
                    <IconButton
                      aria-label="Dismiss task action"
                      disabled={isActionPending}
                      size="small"
                      onClick={dismissActionPanel}
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : null}

                {activeAction === "reschedule" ? (
                  <Stack spacing={1.25}>
                    <TextField
                      disabled={isActionPending || isClosedTask}
                      error={Boolean(rescheduleError)}
                      fullWidth
                      helperText={rescheduleError || "Choose a new due date and add a reason."}
                      label="New Due Date"
                      size="small"
                      type="date"
                      value={newDueDate}
                      InputLabelProps={{ shrink: true }}
                      onChange={(event) => {
                        setNewDueDate(event.target.value);
                        if (rescheduleError) setRescheduleError("");
                      }}
                    />
                    <TextField
                      disabled={isActionPending || isClosedTask}
                      fullWidth
                      minRows={2}
                      multiline
                      placeholder="Reason for rescheduling..."
                      size="small"
                      value={rescheduleReason}
                      onChange={(event) => {
                        setRescheduleReason(event.target.value);
                        if (rescheduleError) setRescheduleError("");
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button
                        disabled={isActionPending}
                        sx={{ textTransform: "none" }}
                        onClick={dismissActionPanel}
                      >
                        Dismiss
                      </Button>
                      <Button
                        disabled={isActionPending || isClosedTask}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                        onClick={handleReschedule}
                      >
                        {isReschedulingTask ? <CircularProgress color="inherit" size={18} /> : "Save Reschedule"}
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}

                {activeAction === "complete" ? (
                  <Stack spacing={1.25}>
                    <TextField
                      disabled={isActionPending || isClosedTask}
                      error={Boolean(completionError)}
                      fullWidth
                      helperText={completionError || "Provide at least 10 characters before finishing."}
                      minRows={2}
                      multiline
                      placeholder="Add completion note..."
                      size="small"
                      value={completionNote}
                      onChange={(event) => {
                        setCompletionNote(event.target.value);
                        if (completionError) {
                          setCompletionError("");
                        }
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button
                        disabled={isActionPending}
                        sx={{ textTransform: "none" }}
                        onClick={dismissActionPanel}
                      >
                        Dismiss
                      </Button>
                      <Button
                        disabled={isActionPending || isClosedTask}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                        onClick={handleMarkComplete}
                      >
                        {isCompletingTask ? <CircularProgress color="inherit" size={18} /> : "Mark Complete"}
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}

                {activeAction === "cancel" ? (
                  <Stack spacing={1.25}>
                    <TextField
                      disabled={isActionPending || isClosedTask}
                      error={Boolean(cancelError)}
                      fullWidth
                      helperText={cancelError || "Provide at least 5 characters before cancelling."}
                      minRows={2}
                      multiline
                      placeholder="Reason for cancellation..."
                      size="small"
                      value={cancelReason}
                      onChange={(event) => {
                        setCancelReason(event.target.value);
                        if (cancelError) setCancelError("");
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button
                        disabled={isActionPending}
                        sx={{ textTransform: "none" }}
                        onClick={dismissActionPanel}
                      >
                        Dismiss
                      </Button>
                      <Button
                        color="error"
                        disabled={isActionPending || isClosedTask}
                        sx={{ textTransform: "none" }}
                        variant="contained"
                        onClick={handleCancel}
                      >
                        {isCancellingTask ? <CircularProgress color="inherit" size={18} /> : "Cancel Task"}
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          </>
        ) : null}
      </Box>
    </Drawer>
  );
}
