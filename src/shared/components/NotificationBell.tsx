import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import {
  notificationLink,
  notificationsApi,
  type AppNotification,
} from "@/shared/services/notificationsApi";

type NotificationBellProps = {
  sx?: object;
};

/** "2 hours ago" beats a timestamp here — the question is always how fresh this is. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

/**
 * The notification bell, and the list behind it.
 *
 * The badge is its own request — a count, not a page of rows counted on the client — since
 * it runs on every page load while the list is only fetched once somebody opens the menu.
 */
export function NotificationBell({ sx }: NotificationBellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    // A minute is soon enough for something that is not time-critical, and keeps the
    // request off the hot path of every navigation.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: notifications = [], isLoading } = useQuery({
    enabled: open,
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsApi.list(15),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refresh,
  });

  const openNotification = async (notification: AppNotification) => {
    setAnchor(null);
    if (!notification.read) {
      await notificationsApi.markRead(notification.id).catch(() => undefined);
      await refresh();
    }
    const link = notificationLink(notification);
    if (link) navigate(link);
  };

  return (
    <>
      <IconButton
        aria-label={unread > 0 ? `notifications, ${unread} unread` : "notifications"}
        sx={{ ...sx, position: "relative" }}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <NotificationsNoneRounded sx={{ fontSize: 15 }} />
        {unread > 0 ? (
          <Box
            sx={{
              bgcolor: "primary.main",
              border: "1.5px solid #fff",
              borderRadius: "50%",
              height: 7,
              position: "absolute",
              right: 5,
              top: 5,
              width: 7,
            }}
          />
        ) : null}
      </IconButton>

      <Menu
        anchorEl={anchor}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        open={open}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420, borderRadius: "12px" } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        onClose={() => setAnchor(null)}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25 }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Notifications</Typography>
          {unread > 0 ? (
            <Button
              disabled={markAllRead.isPending}
              size="small"
              sx={{ textTransform: "none", fontSize: 12 }}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </Stack>
        <Divider />

        {isLoading ? (
          <Typography color="text.secondary" sx={{ fontSize: 13, px: 2, py: 2.5 }}>
            Loading…
          </Typography>
        ) : notifications.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontSize: 13, px: 2, py: 2.5 }}>
            Nothing to catch up on.
          </Typography>
        ) : (
          notifications.map((notification) => (
            <Box
              key={notification.id}
              role="button"
              sx={{
                cursor: "pointer",
                // Unread rows carry a left rule rather than a tinted background: the list
                // is mostly unread when it matters, and a wall of colour says nothing.
                borderLeft: "3px solid",
                borderLeftColor: notification.read ? "transparent" : "primary.main",
                px: 2,
                py: 1.25,
                "&:hover": { bgcolor: "#F5F8FB" },
              }}
              onClick={() => void openNotification(notification)}
            >
              <Typography
                sx={{ fontSize: 13, fontWeight: notification.read ? 500 : 700, lineHeight: 1.35 }}
              >
                {notification.title}
              </Typography>
              {notification.body ? (
                <Typography
                  color="text.secondary"
                  sx={{
                    fontSize: 12,
                    mt: 0.25,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {notification.body}
                </Typography>
              ) : null}
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 0.5 }}>
                {notification.actorName ? `${notification.actorName} · ` : ""}
                {relativeTime(notification.createdAt)}
              </Typography>
            </Box>
          ))
        )}
      </Menu>
    </>
  );
}
