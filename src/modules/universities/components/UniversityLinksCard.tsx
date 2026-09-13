import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type UniversityLink = {
  id?: string;
  label: string;
  url: string;
  tag?: string | null;
};

type UniversityLinksCardProps = {
  universityId: string;
  canManage: boolean;
};

/** Suggestions, not a fixed list — the field stays free text. */
const TAG_HINTS = ["Website", "Courses", "Agent portal", "Scholarships", "Brochure"];

/**
 * The links worth keeping about a university.
 *
 * The record carries one `website`; everything else — the course catalogue, the agent
 * portal, a scholarship page — previously went into the notes field and was lost. Saved as
 * a set, because their order is part of what somebody is arranging.
 */
export function UniversityLinksCard({ universityId, canManage }: UniversityLinksCardProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<UniversityLink[]>([]);
  const [editing, setEditing] = useState(false);

  const linksQuery = useQuery({
    enabled: Boolean(universityId),
    queryKey: ["university-links", universityId],
    queryFn: async () => {
      const response = await httpClient.get<UniversityLink[]>(
        `/universities/${universityId}/links`,
      );
      return response.data ?? [];
    },
  });

  const saved = linksQuery.data ?? [];
  const signature = saved.map((link) => `${link.label}|${link.url}|${link.tag ?? ""}`).join("~");

  useEffect(() => {
    setDraft(saved.map((link) => ({ label: link.label, url: link.url, tag: link.tag ?? "" })));
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      const response = await httpClient.put<UniversityLink[]>(
        `/universities/${universityId}/links`,
        draft.filter((link) => link.label.trim() && link.url.trim()),
      );
      return response.data;
    },
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["university-links", universityId] });
    },
  });

  const update = (index: number, patch: Partial<UniversityLink>) =>
    setDraft((current) => current.map((link, i) => (i === index ? { ...link, ...patch } : link)));

  if (linksQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 2 }}>
        <CircularProgress size={20} />
      </Stack>
    );
  }

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {saved.length === 0 ? "No links saved." : `${saved.length} link${saved.length === 1 ? "" : "s"}`}
        </Typography>
        {canManage ? (
          editing ? (
            <Stack direction="row" spacing={0.75}>
              <Button
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => {
                  setDraft(saved.map((l) => ({ label: l.label, url: l.url, tag: l.tag ?? "" })));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={save.isPending}
                size="small"
                sx={{ textTransform: "none" }}
                variant="contained"
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </Stack>
          ) : (
            <Button size="small" sx={{ textTransform: "none" }} onClick={() => setEditing(true)}>
              {saved.length === 0 ? "Add links" : "Edit"}
            </Button>
          )
        ) : null}
      </Stack>

      {save.isError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {getApiErrorMessage(save.error, "Unable to save the links.")}
        </Alert>
      ) : null}

      {editing ? (
        <Stack spacing={1.25}>
          {draft.map((link, index) => (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <TextField
                label="Label"
                size="small"
                sx={{ width: 150, flexShrink: 0 }}
                value={link.label}
                onChange={(event) => update(index, { label: event.target.value })}
              />
              <TextField
                fullWidth
                label="URL"
                placeholder="https://…"
                size="small"
                value={link.url}
                onChange={(event) => update(index, { url: event.target.value })}
              />
              <TextField
                label="Tag"
                size="small"
                sx={{ width: 140, flexShrink: 0 }}
                value={link.tag ?? ""}
                onChange={(event) => update(index, { tag: event.target.value })}
              />
              <IconButton
                aria-label={`Remove link ${index + 1}`}
                size="small"
                onClick={() => setDraft((current) => current.filter((_l, i) => i !== index))}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Box>
            <Button
              size="small"
              startIcon={<AddRounded />}
              sx={{ textTransform: "none" }}
              onClick={() => setDraft((current) => [...current, { label: "", url: "", tag: "" }])}
            >
              Add a link
            </Button>
          </Box>

          <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
            Tags are free text — {TAG_HINTS.join(", ")} are just suggestions.
          </Typography>
        </Stack>
      ) : saved.length === 0 ? (
        <Typography color="text.disabled" sx={{ fontSize: 13 }}>
          Course catalogue, agent portal, brochures — anything worth finding again.
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          {saved.map((link) => (
            <Stack
              key={link.id ?? link.url}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              {link.tag ? (
                <Chip
                  label={link.tag}
                  size="small"
                  sx={{
                    backgroundColor: "#EEF2F6",
                    color: "#55707C",
                    fontSize: 11,
                    height: 20,
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <Link
                href={link.url}
                rel="noopener noreferrer"
                target="_blank"
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  fontSize: 13.5,
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                {link.label}
                <OpenInNewRounded sx={{ fontSize: 13 }} />
              </Link>
            </Stack>
          ))}
        </Stack>
      )}
    </>
  );
}
