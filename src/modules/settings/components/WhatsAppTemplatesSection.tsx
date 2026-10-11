import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import SyncRounded from "@mui/icons-material/SyncRounded";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type Template = {
  id: string;
  name: string;
  category: string;
  status: string;
  bodyText: string;
  paramCount: number;
};

type Trigger = {
  triggerName: string;
  templateId: string | null;
  templateName: string | null;
  isActive: boolean;
};

type Draft = {
  name: string;
  category: "MARKETING" | "UTILITY";
  bodyText: string;
  example: string;
  footerText: string;
  quickReplies: [string, string, string];
};

const TEMPLATES_KEY = ["whatsapp", "templates"];
const TRIGGERS_KEY = ["whatsapp", "triggers"];

const EMPTY_DRAFT: Draft = {
  name: "",
  category: "MARKETING",
  bodyText: "",
  example: "",
  footerText: "",
  quickReplies: ["", "", ""],
};

/** Statuses Meta may still change on its own; the list keeps checking while any is shown. */
const IN_REVIEW = ["PENDING", "IN_APPEAL"];

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  APPROVED: "success",
  PENDING: "warning",
  IN_APPEAL: "warning",
  REJECTED: "error",
  PAUSED: "error",
  DISABLED: "error",
};

/** VUTrak fills {{1}} with the lead's first name and nothing else, so one variable at most. */
function variablesIn(text: string) {
  return Array.from(text.matchAll(/\{\{(\d+)\}\}/g), (m) => Number(m[1]));
}

function draftError(d: Draft): string | null {
  if (!/^[a-z0-9_]+$/.test(d.name)) return "Name: lowercase letters, numbers and underscores only, e.g. welcome_lead.";
  if (!d.bodyText.trim()) return "Write the message.";
  const vars = variablesIn(d.bodyText);
  if (vars.some((v) => v !== 1)) return "Only {{1}} is supported. VUTrak fills it with the student's first name.";
  if (vars.length > 0 && !d.example.trim()) return "Give a sample first name for {{1}}; Meta needs it to review the template.";
  return null;
}

/**
 * The agency's WhatsApp message templates: create one, follow Meta's review, and
 * choose which approved template greets new leads.
 *
 * Creating here submits straight to Meta for review, the same as WhatsApp Manager;
 * Meta's verdict arrives later; the list re-checks with Meta while anything is in review.
 */
export function WhatsAppTemplatesSection({
  connected,
  configTemplateName,
}: {
  connected: boolean;
  configTemplateName: string | null;
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  // Statuses live on Meta, so the list is fetched from Meta (sync) rather than from our
  // copy, and fetched again every minute while one is still in review: an approval then
  // shows up on its own. If Meta cannot be reached, our last copy is shown instead.
  const [fromCache, setFromCache] = useState(false);
  const templatesQuery = useQuery({
    queryKey: TEMPLATES_KEY,
    // Templates belong to the connected WhatsApp Business account; there is none to ask about yet.
    enabled: connected,
    queryFn: async () => {
      try {
        const synced = (await httpClient.post<Template[]>("/whatsapp/templates/sync")).data ?? [];
        setFromCache(false);
        return [...synced].sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        setFromCache(true);
        return (await httpClient.get<Template[]>("/whatsapp/templates")).data ?? [];
      }
    },
    refetchInterval: (query) =>
      (query.state.data ?? []).some((t) => IN_REVIEW.includes(t.status)) ? 60_000 : false,
  });
  const triggersQuery = useQuery({
    queryKey: TRIGGERS_KEY,
    enabled: connected,
    queryFn: async () => (await httpClient.get<Trigger[]>("/whatsapp/templates/triggers")).data ?? [],
  });

  const welcomeTrigger = triggersQuery.data?.find((t) => t.triggerName === "LEAD_CREATED");
  const welcomeName = welcomeTrigger?.isActive ? welcomeTrigger.templateName : configTemplateName;

  const lastChecked = templatesQuery.dataUpdatedAt
    ? new Date(templatesQuery.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const create = useMutation({
    mutationFn: async (d: Draft) => {
      const response = await httpClient.post<Template>("/whatsapp/templates", {
        name: d.name,
        category: d.category,
        bodyText: d.bodyText.trim(),
        bodyExamples: variablesIn(d.bodyText).length ? [d.example.trim()] : [],
        footerText: d.footerText.trim() || undefined,
        quickReplies: d.quickReplies.map((q) => q.trim()).filter(Boolean),
      });
      return response.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      setDialogOpen(false);
      setDraft(EMPTY_DRAFT);
      setNotice({
        severity: "success",
        text: `"${created.name}" was submitted to Meta for review (status: ${created.status}).`,
      });
    },
  });

  const setWelcome = useMutation({
    mutationFn: async (template: Template) =>
      (await httpClient.put("/whatsapp/templates/triggers", {
        triggerName: "LEAD_CREATED",
        templateId: template.id,
        isActive: true,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIGGERS_KEY });
      setNotice({ severity: "success", text: "New leads will now get this welcome message." });
    },
    onError: (err) => setNotice({ severity: "error", text: getApiErrorMessage(err, "Could not set the welcome message") }),
  });

  const error = draftError(draft);
  const preview = useMemo(
    () => draft.bodyText.replace(/\{\{1\}\}/g, draft.example.trim() || "{{1}}"),
    [draft.bodyText, draft.example],
  );
  const hasVariable = variablesIn(draft.bodyText).length > 0;
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 3, mt: 2.5 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1 }}
      >
        <Typography sx={{ fontWeight: 600 }}>Message templates</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={templatesQuery.isFetching ? <CircularProgress size={14} /> : <SyncRounded />}
            disabled={!connected || templatesQuery.isFetching}
            onClick={() => {
              setNotice(null);
              void templatesQuery.refetch();
            }}
          >
            Refresh status
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddRounded />}
            disabled={!connected}
            onClick={() => {
              setNotice(null);
              create.reset();
              setDialogOpen(true);
            }}
          >
            New template
          </Button>
        </Stack>
      </Stack>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
        New templates go to Meta for review before they can be sent. Welcome message for new leads:{" "}
        <strong>{welcomeName ?? "not set"}</strong>
      </Typography>
      {lastChecked && (
        <Typography color={fromCache ? "warning.main" : "text.secondary"} variant="caption" sx={{ display: "block", mb: 2, mt: -1 }}>
          {fromCache
            ? `Meta could not be reached; showing statuses as last saved (${lastChecked}).`
            : `Statuses checked with Meta at ${lastChecked}${
                (templatesQuery.data ?? []).some((t) => IN_REVIEW.includes(t.status)) ? ", checking again every minute while in review" : ""
              }.`}
        </Typography>
      )}

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice.text}
        </Alert>
      )}

      {!connected ? (
        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
          Connect WhatsApp above to create message templates and see their review status.
        </Typography>
      ) : templatesQuery.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : templatesQuery.isError ? (
        <Alert severity="error">{getApiErrorMessage(templatesQuery.error, "Could not load templates")}</Alert>
      ) : (templatesQuery.data ?? []).length === 0 ? (
        <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
          No templates yet. Create one with New template.
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Message</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {(templatesQuery.data ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                <TableCell>{t.category.charAt(0) + t.category.slice(1).toLowerCase()}</TableCell>
                <TableCell>
                  <Chip size="small" label={t.status} color={STATUS_COLOR[t.status] ?? "default"} />
                </TableCell>
                <TableCell sx={{ maxWidth: 220, color: "text.secondary" }}>
                  <Typography noWrap variant="body2" title={t.bodyText}>
                    {t.bodyText}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {t.name === welcomeName ? (
                    <Chip size="small" variant="outlined" label="Welcome message" />
                  ) : t.status === "APPROVED" && t.paramCount <= 1 ? (
                    <Button
                      size="small"
                      disabled={setWelcome.isPending}
                      onClick={() => {
                        setNotice(null);
                        setWelcome.mutate(t);
                      }}
                    >
                      Use for new leads
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !create.isPending && setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>New WhatsApp template</DialogTitle>
        <DialogContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ pt: 1 }}>
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField
                label="Template name"
                value={draft.name}
                onChange={(e) => setField("name", e.target.value.toLowerCase().replace(/[\s-]+/g, "_"))}
                helperText="Lowercase and underscores, e.g. welcome_lead"
                size="small"
                required
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Category"
                  value={draft.category}
                  onChange={(e) => setField("category", e.target.value as Draft["category"])}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="MARKETING">Marketing</MenuItem>
                  <MenuItem value="UTILITY">Utility</MenuItem>
                </TextField>
                <TextField label="Language" value="English (US)" size="small" disabled sx={{ flex: 1 }} />
              </Stack>
              <TextField
                label="Message"
                value={draft.bodyText}
                onChange={(e) => setField("bodyText", e.target.value)}
                helperText="Use {{1}} where the student's first name should go"
                multiline
                minRows={4}
                size="small"
                required
              />
              {hasVariable && (
                <TextField
                  label="Sample first name for {{1}}"
                  value={draft.example}
                  onChange={(e) => setField("example", e.target.value)}
                  helperText="Meta uses this to review the template"
                  size="small"
                  required
                />
              )}
              <TextField
                label="Footer (optional)"
                value={draft.footerText}
                onChange={(e) => setField("footerText", e.target.value)}
                inputProps={{ maxLength: 60 }}
                size="small"
              />
              <Stack direction="row" spacing={1}>
                {draft.quickReplies.map((q, i) => (
                  <TextField
                    key={i}
                    label={`Quick reply ${i + 1}`}
                    value={q}
                    onChange={(e) => {
                      const next = [...draft.quickReplies] as Draft["quickReplies"];
                      next[i] = e.target.value;
                      setField("quickReplies", next);
                    }}
                    inputProps={{ maxLength: 25 }}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                ))}
              </Stack>
            </Stack>

            <Box sx={{ width: { md: 280 }, bgcolor: "#ECE5DD", borderRadius: "12px", p: 2, alignSelf: "flex-start" }}>
              <Typography variant="caption" color="text.secondary">
                Preview
              </Typography>
              <Box sx={{ bgcolor: "#fff", borderRadius: "8px", p: 1.5, mt: 1, boxShadow: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {preview || "Your message appears here."}
                </Typography>
                {draft.footerText.trim() && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {draft.footerText}
                  </Typography>
                )}
              </Box>
              {draft.quickReplies
                .filter((q) => q.trim())
                .map((q, i) => (
                  <Box
                    key={i}
                    sx={{ bgcolor: "#fff", borderRadius: "8px", py: 0.75, mt: 0.75, textAlign: "center", color: "#00A5F4", fontSize: 14 }}
                  >
                    {q}
                  </Box>
                ))}
            </Box>
          </Stack>

          {create.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getApiErrorMessage(create.error, "Meta did not accept the template")}
            </Alert>
          )}
          {draft.name && error && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!!error || create.isPending}
            onClick={() => create.mutate(draft)}
            startIcon={create.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {create.isPending ? "Submitting..." : "Submit to Meta"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
