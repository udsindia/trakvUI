import { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneAndroidRounded from "@mui/icons-material/PhoneAndroidRounded";
import { WhatsAppTemplatesSection } from "@/modules/settings/components/WhatsAppTemplatesSection";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import {
  isEmbeddedSignupConfigured,
  launchEmbeddedSignup,
  type EmbeddedSignupIds,
  type EmbeddedSignupPrefill,
} from "@/shared/services/meta/whatsappEmbeddedSignup";

type WhatsAppConfig = {
  phoneNumberId: string;
  wabaId: string | null;
  welcomeTemplateName: string | null;
  isActive: boolean;
  /** COEXISTENCE: the number is also used in the WhatsApp Business app. */
  onboardingType?: "CLOUD_API" | "COEXISTENCE" | null;
  updatedAt: string;
};

const CONFIG_KEY = ["whatsapp", "config"];

/** GET /whatsapp/embedded-signup/settings: the Meta ids, plus what to pre-fill in Meta's form. */
type SignupSettings = EmbeddedSignupIds & { prefill?: EmbeddedSignupPrefill };

/**
 * The agency connects its own WhatsApp Business number.
 *
 * Until this page, only a super admin could, by pasting a token and ids for the agency.
 * Meta's Embedded Signup popup lets the agency sign in to Meta, pick or create its
 * business, account and number, and hand VUTrak a code; the backend swaps that code
 * for a token, registers the number and subscribes it to our webhook.
 *
 * Nothing secret is shown here: the token never reaches the browser, and the verify
 * token in the config response is ours, not the agency's.
 */
export function WhatsAppSettingsPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  // The Meta ids come from the backend, so setting them there is enough; a failure here
  // falls back to whatever the build was given.
  const { data: signupIds, isLoading: signupIdsLoading } = useQuery({
    queryKey: ["whatsapp", "embedded-signup-settings"],
    queryFn: async () => {
      try {
        return (await httpClient.get<SignupSettings>("/whatsapp/embedded-signup/settings")).data;
      } catch {
        return undefined;
      }
    },
    staleTime: Infinity,
  });
  const signupAvailable = isEmbeddedSignupConfigured(signupIds);

  const { data: config, isLoading, isError, error } = useQuery({
    queryKey: CONFIG_KEY,
    queryFn: async () => {
      try {
        const response = await httpClient.get<WhatsAppConfig>("/whatsapp/config");
        return response.data;
      } catch (err) {
        // 404 is the normal answer for an agency that has never connected.
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
  });

  // coexistence: connect the number the business already uses in the WhatsApp Business app.
  const connect = useMutation({
    mutationFn: async (coexistence: boolean) => {
      const result = await launchEmbeddedSignup(signupIds, signupIds?.prefill, { coexistence });
      const response = await httpClient.post<WhatsAppConfig>("/whatsapp/embedded-signup", {
        code: result.code,
        wabaId: result.wabaId,
        phoneNumberId: result.phoneNumberId,
        // Meta's finish event is what counts: the person may have switched flows in the popup.
        coexistence: result.coexistence,
      });
      return response.data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(CONFIG_KEY, saved);
      setNotice({
        severity: "success",
        text:
          saved.onboardingType === "COEXISTENCE"
            ? "WhatsApp connected, and your number stays in the WhatsApp Business app. Your contacts and " +
              "chats from the last 6 months are being copied into VUTrak."
            : "WhatsApp connected. New leads will get your welcome message from this number.",
      });
    },
    onError: (err) =>
      setNotice({ severity: "error", text: getApiErrorMessage(err, "WhatsApp could not be connected") }),
  });

  // Meta allows the contacts + history sync once, within 24 hours of connecting; signup
  // already asks for it, so this is only for when that request failed.
  const resync = useMutation({
    mutationFn: async () =>
      (await httpClient.post<Record<string, string>>("/whatsapp/coexistence/sync")).data,
    onSuccess: () =>
      setNotice({ severity: "success", text: "Asked Meta for your contacts and chat history again." }),
    onError: (err) =>
      setNotice({ severity: "error", text: getApiErrorMessage(err, "Could not request the sync") }),
  });
  const isCoexistence = config?.onboardingType === "COEXISTENCE";

  const status = !config
    ? { label: "Not connected", color: "default" as const }
    : config.isActive
      ? { label: "Connected", color: "success" as const }
      : { label: "Disconnected", color: "warning" as const };

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>WhatsApp</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2.5 }}>
        Connect your agency's WhatsApp Business number. VUTrak sends your approved welcome
        message to each new lead from this number and records their replies on the lead.
      </Typography>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice.text}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : isError ? (
          <Alert severity="error">{getApiErrorMessage(error, "Could not load the WhatsApp settings")}</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <WhatsAppIcon sx={{ color: "#25D366" }} />
              <Typography sx={{ fontWeight: 600 }}>WhatsApp Business</Typography>
              <Chip label={status.label} color={status.color} size="small" />
            </Stack>

            {config && (
              <Box
                component="dl"
                sx={{ display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: 3, rowGap: 0.75, m: 0, fontSize: 14 }}
              >
                <Box component="dt" sx={{ color: "text.secondary" }}>Phone number ID</Box>
                <Box component="dd" sx={{ m: 0 }}>{config.phoneNumberId}</Box>
                <Box component="dt" sx={{ color: "text.secondary" }}>Business account ID</Box>
                <Box component="dd" sx={{ m: 0 }}>{config.wabaId ?? "-"}</Box>
                <Box component="dt" sx={{ color: "text.secondary" }}>Welcome template</Box>
                <Box component="dd" sx={{ m: 0 }}>{config.welcomeTemplateName ?? "-"}</Box>
                <Box component="dt" sx={{ color: "text.secondary" }}>Connection</Box>
                <Box component="dd" sx={{ m: 0 }}>
                  {isCoexistence ? "Shared with the WhatsApp Business app" : "WhatsApp Cloud API only"}
                </Box>
              </Box>
            )}

            {isCoexistence && (
              <Alert severity="info">
                You can keep replying from the WhatsApp Business app on your phone; those replies show up on the
                lead too. When you reply to a chat from the app, VUTrak's automatic replies stop for that chat.
                Open the app at least every two weeks, or Meta disconnects the number from VUTrak.
                <Box sx={{ mt: 1 }}>
                  <Button size="small" disabled={resync.isPending} onClick={() => { setNotice(null); resync.mutate(); }}>
                    {resync.isPending ? "Requesting..." : "Contacts or chats missing? Request them again"}
                  </Button>
                </Box>
              </Alert>
            )}

            {config && !config.isActive && (
              <Alert severity="warning">
                Meta stopped accepting the saved connection, so no messages are being sent. Reconnect to fix it.
              </Alert>
            )}

            {/* Always shown, so the agency can see where connecting happens; disabled with
                the reason until the Meta side is configured. */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
              <Button
                variant="contained"
                disabled={!signupAvailable || connect.isPending}
                onClick={() => {
                  setNotice(null);
                  connect.mutate(true);
                }}
                startIcon={connect.isPending && connect.variables ? <CircularProgress size={16} color="inherit" /> : <PhoneAndroidRounded />}
                sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#1da851" } }}
              >
                {connect.isPending && connect.variables ? "Connecting..." : "Use my WhatsApp Business app number"}
              </Button>
              <Button
                variant="outlined"
                disabled={!signupAvailable || connect.isPending}
                onClick={() => {
                  setNotice(null);
                  connect.mutate(false);
                }}
                startIcon={connect.isPending && !connect.variables ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
              >
                {connect.isPending && !connect.variables
                  ? "Connecting..."
                  : config ? "Reconnect with a new number" : "Connect a new number"}
              </Button>
            </Stack>

            <Typography color={signupAvailable || signupIdsLoading ? "text.secondary" : "warning.main"} variant="caption">
              {signupAvailable || signupIdsLoading
                ? "Already using the WhatsApp Business app? Choose the first option: your number stays on your " +
                  "phone and you confirm by scanning a QR code in the app. Otherwise connect a number that isn't " +
                  "on WhatsApp yet. Both open Meta's window to sign in with Facebook and pick your business. " +
                  "Reconnecting keeps your welcome template."
                : "Connecting is not available yet: the Meta App ID and Embedded Signup configuration still have " +
                  "to be set up for this VUTrak site."}
            </Typography>
          </Stack>
        )}
      </Paper>

      {!isLoading && !isError && (
        <WhatsAppTemplatesSection connected={!!config} configTemplateName={config?.welcomeTemplateName ?? null} />
      )}
    </Box>
  );
}
