import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { BoardTask, TaskColumnKey, TaskPriority } from "@/modules/activities/types/types";

/**
 * Tasks as rows rather than cards.
 *
 * The board reads well at five tasks and stops working at fifty: a card is roughly ten
 * times the height of the one line it is actually saying, so the answer to "what do I do
 * next" ends up several screens apart. This shows the same tasks at a glance, and the
 * description — the bulk of a card — moves behind the click that opens the task anyway.
 *
 * Sorted by due date by default, because that is the question being asked.
 */

type SortKey = "dueDate" | "title" | "priority" | "about" | "assignee";

type TaskTableProps = {
  tasks: BoardTask[];
  /** Shown only when the list spans people; in a personal list it is a column of one name. */
  showAssignee?: boolean;
  onTaskClick: (taskId: string) => void;
};

const COLUMN_LABEL: Record<TaskColumnKey, string> = {
  todo: "To do",
  inProgress: "In progress",
  done: "Done",
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/** Only the two that need to interrupt are coloured; the rest stay quiet. */
const PRIORITY_SX: Record<TaskPriority, object> = {
  URGENT: { backgroundColor: "#FDE7E7", color: "#B3261E", fontWeight: 600 },
  HIGH: { backgroundColor: "#FFF1E0", color: "#A65600", fontWeight: 600 },
  MEDIUM: { backgroundColor: "transparent", color: "text.secondary" },
  LOW: { backgroundColor: "transparent", color: "text.disabled" },
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Days until due. Negative is overdue. Null when the date cannot be read. */
function daysUntil(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - startOfToday().getTime()) / 86_400_000);
}

/** "Overdue 3d" carries more than a date a reader has to compare against today. */
function dueLabel(dueDate: string): { text: string; overdue: boolean; soon: boolean } {
  const days = daysUntil(dueDate);
  if (days === null) return { text: dueDate || "—", overdue: false, soon: false };
  if (days < 0) return { text: `Overdue ${Math.abs(days)}d`, overdue: true, soon: false };
  if (days === 0) return { text: "Today", overdue: false, soon: true };
  if (days === 1) return { text: "Tomorrow", overdue: false, soon: true };
  if (days <= 7) return { text: `In ${days}d`, overdue: false, soon: false };
  return { text: dueDate, overdue: false, soon: false };
}

export function TaskTable({ tasks, showAssignee = false, onTaskClick }: TaskTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("dueDate");
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    const value = (task: BoardTask): string | number => {
      switch (sortBy) {
        case "title":
          return task.title.toLowerCase();
        case "priority":
          return PRIORITY_ORDER[task.priority];
        case "about":
          return (task.linkedLead?.name ?? "").toLowerCase();
        case "assignee":
          return (task.assignedAgent?.name ?? "").toLowerCase();
        case "dueDate":
        default: {
          const days = daysUntil(task.dueDate);
          // Undated tasks sort last rather than pretending to be urgent.
          return days === null ? Number.MAX_SAFE_INTEGER : days;
        }
      }
    };
    return [...tasks].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (left === right) return a.title.localeCompare(b.title);
      return (left < right ? -1 : 1) * (ascending ? 1 : -1);
    });
  }, [tasks, sortBy, ascending]);

  const toggle = (key: SortKey) => {
    if (key === sortBy) {
      setAscending((current) => !current);
      return;
    }
    setSortBy(key);
    setAscending(true);
  };

  const header = (key: SortKey, label: string, width?: number) => (
    <TableCell sx={{ fontSize: 12, fontWeight: 700, py: 1, width }}>
      <TableSortLabel
        active={sortBy === key}
        direction={sortBy === key && !ascending ? "desc" : "asc"}
        onClick={() => toggle(key)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  if (tasks.length === 0) {
    return (
      <Box sx={{ px: 2, py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" variant="body2">
          Nothing here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {header("dueDate", "Due", 110)}
            {header("title", "Task")}
            {header("about", "About", 180)}
            {showAssignee ? header("assignee", "Assignee", 150) : null}
            {header("priority", "Priority", 100)}
            <TableCell sx={{ fontSize: 12, fontWeight: 700, py: 1, width: 110 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((task) => {
            const due = dueLabel(task.dueDate);
            return (
              <TableRow
                key={task.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onTaskClick(task.id)}
              >
                <TableCell sx={{ py: 0.75 }}>
                  <Typography
                    sx={{
                      color: due.overdue ? "error.main" : due.soon ? "warning.main" : "text.secondary",
                      fontSize: 12,
                      fontWeight: due.overdue || due.soon ? 700 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {due.text}
                  </Typography>
                </TableCell>

                <TableCell sx={{ py: 0.75 }}>
                  {/* The description is deliberately not here — it is what made the board
                      unreadable in bulk, and it is one click away. */}
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{task.title}</Typography>
                </TableCell>

                <TableCell sx={{ py: 0.75 }}>
                  <Typography color="text.secondary" noWrap sx={{ fontSize: 12 }}>
                    {task.linkedLead?.name ?? "—"}
                  </Typography>
                </TableCell>

                {showAssignee ? (
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography color="text.secondary" noWrap sx={{ fontSize: 12 }}>
                      {task.assignedAgent?.name ?? "—"}
                    </Typography>
                  </TableCell>
                ) : null}

                <TableCell sx={{ py: 0.75 }}>
                  <Stack direction="row">
                    <Chip
                      label={task.priority.toLowerCase()}
                      size="small"
                      sx={{
                        ...PRIORITY_SX[task.priority],
                        fontSize: 11,
                        height: 20,
                        textTransform: "capitalize",
                      }}
                    />
                  </Stack>
                </TableCell>

                <TableCell sx={{ py: 0.75 }}>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    {COLUMN_LABEL[task.column]}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
