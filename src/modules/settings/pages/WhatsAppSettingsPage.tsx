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
import { WhatsAppTemplatesSection } from "@/modules/settings/components/WhatsAppTemplatesSection";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import {
  isEmbeddedSignupConfigured,
  launchEmbeddedSignup,
  type EmbeddedSignupIds,
} from "@/shared/services/meta/whatsappEmbeddedSignup";

type WhatsAppConfig = {
  phoneNumberId: string;
  wabaId: string | null;
  welcomeTemplateName: string | null;
  isActive: boolean;
  updatedAt: string;
};

const CONFIG_KEY = ["whatsapp", "config"];

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
        return (await httpClient.get<EmbeddedSignupIds>("/whatsapp/embedded-signup/settings")).data;
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

  const connect = useMutation({
    mutationFn: async () => {
      const result = await launchEmbeddedSignup(signupIds);
      const response = await httpClient.post<WhatsAppConfig>("/whatsapp/embedded-signup", {
        code: result.code,
        wabaId: result.wabaId,
        phoneNumberId: result.phoneNumberId,
      });
      return response.data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(CONFIG_KEY, saved);
      setNotice({ severity: "success", text: "WhatsApp connected. New leads will get your welcome message from this number." });
    },
    onError: (err) =>
      setNotice({ severity: "error", text: getApiErrorMessage(err, "WhatsApp could not be connected") }),
  });

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
              </Box>
            )}

            {config && !config.isActive && (
              <Alert severity="warning">
                Meta stopped accepting the saved connection, so no messages are being sent. Reconnect to fix it.
              </Alert>
            )}

            {/* Always shown, so the agency can see where connecting happens; disabled with
                the reason until the Meta side is configured. */}
            <Button
              variant="contained"
              disabled={!signupAvailable || connect.isPending}
              onClick={() => {
                setNotice(null);
                connect.mutate();
              }}
              startIcon={connect.isPending ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
              sx={{ alignSelf: "flex-start", bgcolor: "#25D366", "&:hover": { bgcolor: "#1da851" } }}
            >
              {connect.isPending ? "Connecting..." : config ? "Reconnect WhatsApp" : "Connect WhatsApp"}
            </Button>

            <Typography color={signupAvailable || signupIdsLoading ? "text.secondary" : "warning.main"} variant="caption">
              {signupAvailable || signupIdsLoading
                ? "Connecting opens Meta's window: sign in with Facebook, choose or create your business and " +
                  "WhatsApp Business account, and verify the phone number. Reconnecting replaces the number and " +
                  "keeps your welcome template."
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
