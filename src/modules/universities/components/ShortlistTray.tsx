import CloseRounded from "@mui/icons-material/CloseRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { CourseSearchResult } from "@/modules/universities/universities.types";

type ShortlistTrayProps = {
  items: CourseSearchResult[];
  onRemove: (courseId: string) => void;
  onSend: () => void;
};

export function ShortlistTray({ items, onRemove, onSend }: ShortlistTrayProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "#edf2f7",
        display: "flex",
        flexShrink: 0,
        gap: 1.5,
        overflowX: "auto",
        px: 2.75,
        py: 1.5,
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
        Shortlist ({items.length})
      </Typography>

      {items.map((item) => (
        <Chip
          key={item.id}
          deleteIcon={<CloseRounded sx={{ fontSize: 16 }} />}
          label={`${item.university.shortName} — ${item.name}`}
          size="small"
          sx={{
            bgcolor: "#f8fbfe",
            border: "1px solid",
            borderColor: "#edf2f7",
            fontSize: 11,
            maxWidth: 280,
          }}
          onDelete={() => onRemove(item.id)}
        />
      ))}

      <Button
        size="small"
        sx={{ ml: "auto", textTransform: "none", whiteSpace: "nowrap" }}
        variant="contained"
        onClick={onSend}
      >
        Send Shortlist to Student
      </Button>
    </Box>
  );
}
