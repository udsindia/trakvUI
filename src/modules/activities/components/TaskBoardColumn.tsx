import AddRounded from "@mui/icons-material/AddRounded";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { BoardTask } from "@/modules/activities/types/types";
import { TaskCard } from "@/modules/activities/components/TaskCard";

type TaskBoardColumnProps = {
  count: number;
  tasks: BoardTask[];
  title: string;
  onAddTask?: () => void;
  onTaskClick: (taskId: string) => void;
};

export function TaskBoardColumn({
  count,
  onAddTask,
  tasks,
  title,
  onTaskClick,
}: TaskBoardColumnProps) {
  return (
    <Box
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.5)",
        border: "1px solid",
        borderColor: "rgba(15, 23, 42, 0.06)",
        borderRadius: 4,
        minHeight: 240,
        p: 2,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: 700 }} variant="h6">
              {title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {count}
            </Typography>
          </Stack>

          <IconButton
            aria-label={`Add task to ${title}`}
            disabled={!onAddTask}
            size="small"
            onClick={onAddTask}
          >
            <AddRounded fontSize="small" />
          </IconButton>
        </Stack>

        <Stack spacing={1.5}>
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onTaskClick} />
            ))
          ) : (
            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 3,
                color: "text.secondary",
                px: 2,
                py: 4,
                textAlign: "center",
              }}
            >
              No tasks in this column.
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
