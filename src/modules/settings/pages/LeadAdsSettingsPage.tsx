import { useState } from "react";
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
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FacebookRounded from "@mui/icons-material/FacebookRounded";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { launchFacebookLogin } from "@/shared/services/meta/whatsappEmbeddedSignup";

type ConnectSettings = { appId: string | null; configId: string | null; configured: boolean };

type AdChannelConfig = {
  channel: "META" | "GOOGLE";
  metaPageId: string | null;
  metaFormId: string | null;
  isActive: boolean;
};

type PageChoice = { id: string; name: string | null };
type ConnectStart = { connection: string; pages: PageChoice[] };

type InboundLogEntry = {
  id: string;
  status: "PENDING" | "PROCESSED" | "FAILED" | "DUPLICATE";
  leadId: string | null;
  errorMessage: string | null;
  receivedAt: string;
};

const CONFIGS_KEY = ["ads", "config"];
const LOG_KEY = ["ads", "inbound-log", "META"];

const STATUS_CHIP: Record<InboundLogEntry["status"], { label: string; color: "success" | "error" | "default" | "warning" }> = {
  PROCESSED: { label: "Lead created", color: "success" },
  DUPLICATE: { label: "Already a lead", color: "default" },
  FAILED: { label: "Failed", color: "error" },
  PENDING: { label: "Processing", color: "warning" },
};

/**
 * The agency connects the Facebook Page its lead ads run on, and every lead form
 * submission becomes a VUTrak lead (with the WhatsApp welcome, when WhatsApp is connected).
 *
 * Connecting is Facebook Login for Business with the Lead Ads configuration: the backend
 * swaps the login code for a long-lived token and lists the person's pages; the page they
 * pick is subscribed to Meta's leadgen webhook. No token ever reaches the browser — the
 * page list comes with an encrypted handle that is only good for this tenant, briefly.
 */
export function LeadAdsSettingsPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [picker, setPicker] = useState<ConnectStart | null>(null);
  const [pageId, setPageId] = useState("");
  const [formId, setFormId] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["ads", "meta-connect-settings"],
    queryFn: async () => (await httpClient.get<ConnectSettings>("/ads/config/meta/connect/settings")).data,
    staleTime: Infinity,
  });

  const configs = useQuery({
    queryKey: CONFIGS_KEY,
    queryFn: async () => (await httpClient.get<AdChannelConfig[]>("/ads/config")).data,
  });
  const meta = configs.data?.find((c) => c.channel === "META");

  const inbound = useQuery({
    queryKey: LOG_KEY,
    queryFn: async () =>
      (
        await httpClient.get<{ content: InboundLogEntry[] }>("/ads/config/inbound-log", {
          params: { channel: "META", size: 10, sort: "receivedAt,desc" },
        })
      ).data.content,
    enabled: !!meta,
  });

  const startConnect = useMutation({
    mutationFn: async () => {
      const code = await launchFacebookLogin({ appId: settings?.appId, configId: settings?.configId });
      return (await httpClient.post<ConnectStart>("/ads/config/meta/connect", { code })).data;
    },
    onSuccess: (result) => {
      setPicker(result);
      setPageId(result.pages.find((p) => p.id === meta?.metaPageId)?.id ?? result.pages[0]?.id ?? "");
      setFormId(meta?.metaFormId ?? "");
    },
    onError: (err) => setNotice({ severity: "error", text: getApiErrorMessage(err, "Facebook could not be connected") }),
  });

  const choosePage = useMutation({
    mutationFn: async () =>
      (
        await httpClient.post<AdChannelConfig>("/ads/config/meta/connect/page", {
          connection: picker?.connection,
          pageId,
          formId: formId.trim() || null,
        })
      ).data,
    onSuccess: () => {
      setPicker(null);
      void queryClient.invalidateQueries({ queryKey: CONFIGS_KEY });
      setNotice({
        severity: "success",
        text: "Page connected. New leads from its lead forms will appear in VUTrak within a minute of being submitted.",
      });
    },
    onError: (err) => setNotice({ severity: "error", text: getApiErrorMessage(err, "The page could not be connected") }),
  });

  const retry = useMutation({
    mutationFn: async (id: string) => httpClient.post(`/ads/config/inbound-log/${id}/retry`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LOG_KEY });
      setNotice({ severity: "success", text: "Lead fetched again and created." });
    },
    onError: (err) => setNotice({ severity: "error", text: getApiErrorMessage(err, "The lead could not be fetched again") }),
  });

  const available = !!settings?.configured;
  const pageName = (id: string) => picker?.pages.find((p) => p.id === id)?.name ?? id;

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Facebook & Instagram lead ads</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
        Connect the Facebook Page your lead ads run on. Every lead form submitted on Facebook or Instagram
        becomes a lead here straight away, and gets your WhatsApp welcome message if WhatsApp is connected.
      </Typography>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice.text}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 3 }}>
        {configs.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : configs.isError ? (
          <Alert severity="error">{getApiErrorMessage(configs.error, "Could not load the lead ads settings")}</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <FacebookRounded sx={{ color: "#1877F2" }} />
              <Typography sx={{ fontWeight: 600 }}>Meta lead ads</Typography>
              <Chip
                size="small"
                label={!meta ? "Not connected" : meta.isActive ? "Connected" : "Paused"}
                color={!meta ? "default" : meta.isActive ? "success" : "warning"}
              />
            </Stack>

            {meta && (
              <Box
                component="dl"
                sx={{ display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: 3, rowGap: 0.75, m: 0, fontSize: 14 }}
              >
                <Box component="dt" sx={{ color: "text.secondary" }}>Page ID</Box>
                <Box component="dd" sx={{ m: 0 }}>{meta.metaPageId ?? "-"}</Box>
                <Box component="dt" sx={{ color: "text.secondary" }}>Lead form</Box>
                <Box component="dd" sx={{ m: 0 }}>{meta.metaFormId ?? "All forms on the page"}</Box>
              </Box>
            )}

            <Button
              variant="contained"
              disabled={!available || startConnect.isPending}
              onClick={() => {
                setNotice(null);
                startConnect.mutate();
              }}
              startIcon={startConnect.isPending ? <CircularProgress size={16} color="inherit" /> : <FacebookRounded />}
              sx={{ alignSelf: "flex-start", bgcolor: "#1877F2", "&:hover": { bgcolor: "#145dbf" } }}
            >
              {startConnect.isPending ? "Connecting..." : meta ? "Change page" : "Connect Facebook Page"}
            </Button>

            <Typography color={available || !settings ? "text.secondary" : "warning.main"} variant="caption">
              {available || !settings
                ? "You'll sign in with Facebook and choose the page. You need to be an admin of the page. If your " +
                  "business restricts lead access, also allow VUTrak in Business Settings → Integrations → Leads Access."
                : "Connecting isn't available yet: the Meta app and Lead Ads login configuration still have to be " +
                  "set up for this VUTrak site."}
            </Typography>
          </Stack>
        )}
      </Paper>

      {meta && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 3, mt: 2 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Recent ad leads</Typography>
          {inbound.isLoading ? (
            <CircularProgress size={22} />
          ) : !inbound.data?.length ? (
            <Typography color="text.secondary" variant="body2">
              No leads yet. Submit a test lead with Meta's Lead Ads Testing Tool to check the connection.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Received</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inbound.data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(entry.receivedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip size="small" label={STATUS_CHIP[entry.status].label} color={STATUS_CHIP[entry.status].color} />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>{entry.errorMessage ?? ""}</TableCell>
                      <TableCell align="right">
                        {entry.status === "FAILED" && (
                          <Button size="small" disabled={retry.isPending} onClick={() => retry.mutate(entry.id)}>
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      )}

      <Dialog open={!!picker} onClose={() => !choosePage.isPending && setPicker(null)} fullWidth maxWidth="xs">
        <DialogTitle>Choose your page</DialogTitle>
        <DialogContent>
          <RadioGroup value={pageId} onChange={(e) => setPageId(e.target.value)}>
            {picker?.pages.map((p) => (
              <FormControlLabel key={p.id} value={p.id} control={<Radio />} label={p.name ?? p.id} />
            ))}
          </RadioGroup>
          <TextField
            label="Lead form ID (optional)"
            helperText="Leave empty to take leads from every form on the page."
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPicker(null)} disabled={choosePage.isPending}>Cancel</Button>
          <Button variant="contained" disabled={!pageId || choosePage.isPending} onClick={() => choosePage.mutate()}>
            {choosePage.isPending ? "Connecting..." : `Connect ${pageId ? pageName(pageId) : ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
