import { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import SendRounded from "@mui/icons-material/SendRounded";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

/** OPEN: within 24 h of their last message. HUMAN_AGENT: 24 h to 7 days, a person replying. */
type ReplyWindow = "OPEN" | "HUMAN_AGENT" | "CLOSED";

type Conversation = {
  id: string;
  igsid: string;
  username: string | null;
  displayName: string | null;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  replyWindow: ReplyWindow;
};

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string | null;
  deleted: boolean;
  createdAt: string;
};

const CONVERSATIONS_KEY = ["instagram", "conversations"];
const MAX_BYTES = 1000;

function nameOf(c: Conversation) {
  return c.username ? `@${c.username}` : c.displayName ?? "Instagram user";
}

/**
 * Instagram Direct messages to the agency's Instagram professional account.
 *
 * Messages arrive through Meta's webhook as people write (and replies sent from the Instagram
 * app show up too). A counsellor answers here; Meta allows replies for 24 hours after the
 * person's last message, and a person may still answer up to 7 days with the human-agent tag.
 * The thread refreshes every few seconds so new messages appear without reloading.
 */
export function InstagramInboxPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => (await httpClient.get<Conversation[]>("/instagram/conversations")).data,
    refetchInterval: 5000,
  });
  const selected = conversations.data?.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && conversations.data?.length) setSelectedId(conversations.data[0].id);
  }, [conversations.data, selectedId]);

  const messages = useQuery({
    queryKey: ["instagram", "messages", selectedId],
    queryFn: async () =>
      (await httpClient.get<Message[]>(`/instagram/conversations/${selectedId}/messages`)).data,
    enabled: !!selectedId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, selectedId]);

  const send = useMutation({
    mutationFn: async () =>
      (await httpClient.post<Message>(`/instagram/conversations/${selectedId}/messages`, { text: draft.trim() })).data,
    onSuccess: () => {
      setDraft("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["instagram", "messages", selectedId] });
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
    onError: (err) => setError(getApiErrorMessage(err, "The message could not be sent")),
  });

  const tooLong = new TextEncoder().encode(draft).length > MAX_BYTES;
  const canSend = !!selected && selected.replyWindow !== "CLOSED" && draft.trim().length > 0 && !tooLong;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <InstagramIcon sx={{ color: "#E1306C" }} />
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Instagram Inbox</Typography>
      </Stack>

      {conversations.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(conversations.error, "Could not load Instagram messages")}
        </Alert>
      )}

      {conversations.isLoading ? (
        <CircularProgress size={28} />
      ) : !conversations.data?.length ? (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 4, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>No Instagram messages yet</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Connect the Facebook Page linked to your Instagram professional account, and turn on
            Instagram → Settings → Messages → Connected tools → "Allow access to messages".
            New Direct messages then appear here.
          </Typography>
          <Button component={RouterLink} to="/settings/lead-ads" variant="outlined">
            Connect Facebook Page
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "12px",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "300px 1fr" },
            minHeight: 520,
            overflow: "hidden",
          }}
        >
          <List disablePadding sx={{ borderRight: { md: "1px solid" }, borderColor: { md: "divider" }, overflowY: "auto", maxHeight: { xs: 220, md: 640 } }}>
            {conversations.data.map((c) => (
              <ListItemButton key={c.id} selected={c.id === selectedId} onClick={() => setSelectedId(c.id)}>
                <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 14 }}>
                  {(c.username ?? c.displayName ?? "?").charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={nameOf(c)}
                  secondary={c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ""}
                  slotProps={{ primary: { noWrap: true, fontWeight: 600, fontSize: 14 } }}
                />
              </ListItemButton>
            ))}
          </List>

          <Stack sx={{ minHeight: 0 }}>
            {selected && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography sx={{ fontWeight: 600 }}>{nameOf(selected)}</Typography>
                {selected.displayName && selected.username && (
                  <Typography color="text.secondary" variant="body2">{selected.displayName}</Typography>
                )}
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  label={
                    selected.replyWindow === "OPEN"
                      ? "Can reply"
                      : selected.replyWindow === "HUMAN_AGENT"
                        ? "Reply as a person (up to 7 days)"
                        : "Reply window closed"
                  }
                  color={selected.replyWindow === "OPEN" ? "success" : selected.replyWindow === "HUMAN_AGENT" ? "warning" : "default"}
                />
              </Stack>
            )}

            <Box sx={{ flex: 1, overflowY: "auto", p: 2, maxHeight: 480, bgcolor: "action.hover" }}>
              {messages.isLoading ? (
                <CircularProgress size={22} />
              ) : (
                <Stack spacing={1}>
                  {messages.data?.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        alignSelf: m.direction === "OUTBOUND" ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        bgcolor: m.direction === "OUTBOUND" ? "primary.main" : "background.paper",
                        color: m.direction === "OUTBOUND" ? "primary.contrastText" : "text.primary",
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontStyle: m.deleted ? "italic" : "normal" }}>
                        {m.deleted ? "Message unsent" : m.body}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Box>
                  ))}
                  <div ref={bottomRef} />
                </Stack>
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
                {error}
              </Alert>
            )}

            <Stack
              component="form"
              direction="row"
              spacing={1}
              sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) send.mutate();
              }}
            >
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                placeholder={
                  selected?.replyWindow === "CLOSED"
                    ? "Instagram allows replies only within 7 days of their last message"
                    : "Write a reply"
                }
                disabled={!selected || selected.replyWindow === "CLOSED"}
                value={draft}
                error={tooLong}
                helperText={tooLong ? "Instagram allows up to 1000 characters" : undefined}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) send.mutate();
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!canSend || send.isPending}
                endIcon={send.isPending ? <CircularProgress size={14} color="inherit" /> : <SendRounded />}
              >
                Send
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
