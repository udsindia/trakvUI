import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InboxRounded from "@mui/icons-material/InboxRounded";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { activityService } from "@/modules/activities/activityService";
import type { ActivityEntityType } from "@/modules/activities/activityService";
import { ActivityItem } from "@/modules/activities/components/ActivityItem";
import {
  LogActivityModal,
  type LogActivityFormValues,
} from "@/modules/activities/components/LogActivityModal";
import { applicationReferenceOptions } from "@/modules/activities/mock/mockData";
import { leadApi } from "@/modules/lead/leadApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

function toIsoDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function ActivityFeed() {
  const queryClient = useQueryClient();
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<ActivityEntityType>("GENERAL");

  const activityFeedQuery = useInfiniteQuery({
    queryKey: ["activities", "feed"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      activityService.getActivityFeed({
        before: pageParam,
        limit: 25,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
  });

  const leadsQuery = useQuery({
    enabled: logActivityOpen && selectedEntityType === "LEAD",
    queryKey: ["leads"],
    queryFn: leadApi.getLeads,
  });

  const logActivityMutation = useMutation({
    mutationFn: (payload: Parameters<typeof activityService.createActivity>[0]) =>
      activityService.createActivity(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activities", "feed"] });
    },
  });

  const visibleActivities = useMemo(
    () =>
      (activityFeedQuery.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map(activityService.mapActivityDtoToModel),
    [activityFeedQuery.data?.pages],
  );

  const handleLogActivity = async (values: LogActivityFormValues) => {
    if (!values.type) return;

    const selectedApplication =
      values.entityType === "APPLICATION"
        ? applicationReferenceOptions.find((application) => application.id === values.entityId)
        : null;
    const entityId = values.entityType === "GENERAL" ? null : values.entityId;
    const studentId =
      values.entityType === "APPLICATION"
        ? selectedApplication?.studentId
        : values.entityType === "STUDENT"
          ? values.entityId
          : undefined;

    await logActivityMutation.mutateAsync({
      activityAt: new Date().toISOString(),
      activityType: values.type,
      durationMinutes: values.duration ? Math.trunc(Number(values.duration)) : null,
      entityId,
      entityType: values.entityType,
      nextFollowupAt: toIsoDateTime(values.followUpAt),
      outcomeNotes: values.notes.trim(),
      ...(studentId ? { studentId } : {}),
    });
  };

  const isInitialLoading = activityFeedQuery.isLoading && !visibleActivities.length;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          height: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            bgcolor: "background.default",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: { md: "center" },
              justifyContent: "space-between",
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
            }}
          >
            <Stack spacing={0.5}>
              <Typography sx={{ fontWeight: 700 }} variant="h4">
                Activity Feed
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Latest activities from the backend feed
              </Typography>
            </Stack>

            <Button
              sx={{ px: 2.5, textTransform: "none" }}
              variant="contained"
              onClick={() => {
                setSelectedEntityType("GENERAL");
                setLogActivityOpen(true);
              }}
            >
              Log Activity
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
          {isInitialLoading ? (
            <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <CircularProgress size={32} />
            </Stack>
          ) : activityFeedQuery.isError ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 4,
                px: 3,
                py: 6,
              }}
            >
              <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
                <Typography color="error" variant="body2">
                  {getApiErrorMessage(activityFeedQuery.error, "Failed to load activities.")}
                </Typography>
              </Stack>
            </Paper>
          ) : visibleActivities.length ? (
            <Stack spacing={1.5}>
              {visibleActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}

              {activityFeedQuery.hasNextPage ? (
                <Stack sx={{ alignItems: "center", pt: 1 }}>
                  <Button
                    disabled={activityFeedQuery.isFetchingNextPage}
                    sx={{ textTransform: "none" }}
                    variant="outlined"
                    onClick={() => activityFeedQuery.fetchNextPage()}
                  >
                    {activityFeedQuery.isFetchingNextPage ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 4,
                px: 3,
                py: 6,
              }}
            >
              <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
                <InboxRounded color="disabled" />
                <Typography sx={{ fontWeight: 700 }} variant="h6">
                  No activity records found
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 420 }} variant="body2">
                  New records will appear here after activities are logged.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      </Paper>

      <LogActivityModal
        isLoadingLeads={leadsQuery.isLoading}
        isSubmitting={logActivityMutation.isPending}
        leads={leadsQuery.data ?? []}
        open={logActivityOpen}
        submitErrorMessage={
          logActivityMutation.isError
            ? getApiErrorMessage(logActivityMutation.error, "Unable to save activity.")
            : null
        }
        onClose={() => {
          setLogActivityOpen(false);
          setSelectedEntityType("GENERAL");
        }}
        onEntityTypeChange={setSelectedEntityType}
        onSubmit={handleLogActivity}
      />
    </>
  );
}
