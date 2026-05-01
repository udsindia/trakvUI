import { memo, useState } from "react";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { BoardTask, TaskPriority } from "@/modules/activities/types/types";

type TaskCardProps = {
  task: BoardTask;
  onOpen: (taskId: string) => void;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getPriorityChipStyles(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
    case "HIGH":
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    case "MEDIUM":
      return { backgroundColor: "#ffedd5", color: "#ea580c" };
    case "LOW":
      return { backgroundColor: "#dbeafe", color: "#2563eb" };
    default:
      return { backgroundColor: "#e5e7eb", color: "#475569" };
  }
}

function formatPriority(priority: TaskPriority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function getLabelChipStyles(label?: BoardTask["label"]) {
  switch (label) {
    case "PINNED":
      return { backgroundColor: "#fce7f3", color: "#db2777" };
    case "OVERDUE":
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    case "COMPLETED":
      return { backgroundColor: "#dcfce7", color: "#16a34a" };
    case "IN PROGRESS":
      return { backgroundColor: "#fef3c7", color: "#d97706" };
    default:
      return { backgroundColor: "#f8fafc", color: "#475569" };
  }
}

function TaskCardComponent({ task, onOpen }: TaskCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);
  const priorityStyle = getPriorityChipStyles(task.priority);
  const labelStyle = getLabelChipStyles(task.label);

  const handleOpen = () => {
    onOpen(task.id);
  };

  return (
    <Paper
      elevation={0}
      role="button"
      tabIndex={0}
      sx={{
        border: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.06)",
        borderRadius: 3.5,
        cursor: "pointer",
        p: 2,
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "transform"], {
            duration: theme.transitions.duration.shorter,
          }),
        "&:hover": {
          boxShadow: "0 18px 36px rgba(15, 23, 42, 0.08)",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
          {task.label ? (
            <Chip
              label={task.label}
              size="small"
              sx={{
                alignSelf: "flex-start",
                bgcolor: labelStyle.backgroundColor,
                color: labelStyle.color,
                fontSize: 11,
                fontWeight: 700,
                height: 24,
              }}
            />
          ) : (
            <Box />
          )}

          <IconButton
            aria-label={`Open task actions for ${task.title}`}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setMenuAnchor(event.currentTarget);
            }}
          >
            <MoreHorizRounded fontSize="small" />
          </IconButton>
        </Stack>

        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
            {task.title}
          </Typography>
          <Typography color="text.secondary" sx={{ minHeight: 44 }} variant="body2">
            {task.description}
          </Typography>
        </Stack>

        {task.column === "inProgress" && typeof task.progress === "number" ? (
          <Stack spacing={0.75}>
            <LinearProgress
              sx={{
                borderRadius: 999,
                height: 8,
              }}
              value={task.progress}
              variant="determinate"
            />
            <Typography color="text.secondary" variant="caption">
              {task.progress}% Complete
            </Typography>
          </Stack>
        ) : null}

        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar
              src={task.assignedAgent.avatarUrl}
              sx={{ bgcolor: "primary.light", fontSize: 12, height: 28, width: 28 }}
            >
              {getInitials(task.assignedAgent.name)}
            </Avatar>
            <Typography color="text.secondary" variant="body2">
              {task.assignedAgent.name}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <CalendarMonthRounded color="action" fontSize="small" />
            <Typography color="text.secondary" variant="body2">
              {formatDueDate(task.dueDate)}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <PersonOutlineRounded color="action" fontSize="small" />
            <Typography color="text.secondary" variant="caption">
              {task.linkedLead.name}
            </Typography>
          </Stack>

          <Chip
            label={formatPriority(task.priority)}
            size="small"
            sx={{
              bgcolor: priorityStyle.backgroundColor,
              color: priorityStyle.color,
              fontWeight: 700,
            }}
          />
        </Stack>
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            handleOpen();
          }}
        >
          View details
        </MenuItem>
      </Menu>
    </Paper>
  );
}

export const TaskCard = memo(TaskCardComponent);
