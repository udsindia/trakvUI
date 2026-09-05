import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  CircularProgress,
  ClickAwayListener,
  InputAdornment,
  List,
  ListItemButton,
  ListSubheader,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { useAuth } from "@/app/auth/useAuth";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { applicationsApi } from "@/modules/applications/applicationsApi";
import { applicationDetailsPath } from "@/modules/applications/applicationsRoutePaths";
import { leadApi } from "@/modules/lead/leadApi";
import { leadRoutePaths } from "@/modules/lead/leadRoutePaths";
import { studentsApi } from "@/modules/students/studentsApi";
import { studentDetailsPath } from "@/modules/students/studentsRoutePaths";
import { joinPhoneNumber } from "@/shared/utils/phone";

const MIN_QUERY_LENGTH = 2;
const MAX_PER_GROUP = 5;
const DEBOUNCE_MS = 250;

type SearchResult = {
  key: string;
  group: string;
  primary: string;
  secondary: string;
  to: string;
};

function includesQuery(query: string, ...fields: (string | null | undefined)[]) {
  return fields.some((field) => Boolean(field) && field!.toLowerCase().includes(query));
}

/** Joins the parts that have a value, so a missing course leaves no stray separator. */
function subtitle(...parts: (string | null | undefined)[]) {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
}

function fullName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim();
}

/**
 * The topbar search, across leads, students and applications.
 *
 * Reuses the list pages' own query keys, so once a module has been visited its rows are
 * already in the React Query cache and typing costs no request. The queries stay disabled
 * until there is something to search for — landing on the dashboard should not pull three
 * datasets down.
 *
 * Matching is client-side over those cached lists. No backend endpoint spans the three,
 * and adding one only starts to pay off once a tenant has more rows than fit comfortably
 * in memory — the same point at which the list pages themselves stop loading everything.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const { hasPermissions } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setQuery(inputValue), DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [inputValue]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length >= MIN_QUERY_LENGTH;

  const canViewLeads = hasPermissions([PERMISSIONS.LEAD_VIEW]);
  const canViewStudents = hasPermissions([PERMISSIONS.STUDENTS_VIEW]);
  const canViewApplications = hasPermissions([PERMISSIONS.APPLICATIONS_VIEW]);

  // Keys match LeadDashboardPage, StudentsListPage and ApplicationDashboardPage exactly —
  // same key, same fetcher, one shared cache entry rather than a second copy.
  const leadsQuery = useQuery({
    enabled: isSearching && canViewLeads,
    queryKey: ["leads", "paginated", "all", "createdAt", "DESC"],
    queryFn: () => leadApi.getAllLeadsSorted({ sortBy: "createdAt", sortDirection: "DESC" }),
  });

  const studentsQuery = useQuery({
    enabled: isSearching && canViewStudents,
    queryKey: ["students", "list"],
    queryFn: studentsApi.getStudents,
  });

  const applicationsQuery = useQuery({
    enabled: isSearching && canViewApplications,
    queryKey: ["applications"],
    queryFn: applicationsApi.getApplications,
  });

  const results = useMemo<SearchResult[]>(() => {
    if (!isSearching) return [];

    const leads = (leadsQuery.data ?? [])
      .filter(
        (lead) =>
          !lead.isArchived &&
          includesQuery(
            normalizedQuery,
            fullName(lead.firstName, lead.lastName),
            lead.email,
            lead.phone,
            joinPhoneNumber(lead.countryCode, lead.phone),
          ),
      )
      .slice(0, MAX_PER_GROUP)
      .map<SearchResult>((lead) => ({
        key: `lead-${lead.id}`,
        group: "Leads",
        primary: fullName(lead.firstName, lead.lastName) || lead.email || "Unnamed lead",
        secondary: subtitle(lead.email, joinPhoneNumber(lead.countryCode, lead.phone)),
        to: leadRoutePaths.details(lead.id),
      }));

    const students = (studentsQuery.data ?? [])
      .filter((student) =>
        includesQuery(
          normalizedQuery,
          fullName(student.firstName, student.lastName),
          student.email,
          student.phone,
          joinPhoneNumber(student.countryCode, student.phone),
        ),
      )
      .slice(0, MAX_PER_GROUP)
      .map<SearchResult>((student) => ({
        key: `student-${student.id}`,
        group: "Students",
        primary:
          fullName(student.firstName, student.lastName) || student.email || "Unnamed student",
        secondary: subtitle(student.email, joinPhoneNumber(student.countryCode, student.phone)),
        to: studentDetailsPath(student.id),
      }));

    const applications = (applicationsQuery.data ?? [])
      .filter((application) =>
        includesQuery(
          normalizedQuery,
          application.studentName,
          application.email,
          application.universityName,
          application.courseName,
        ),
      )
      .slice(0, MAX_PER_GROUP)
      .map<SearchResult>((application) => ({
        key: `application-${application.id}`,
        group: "Applications",
        primary: application.studentName || application.email || "Application",
        secondary: subtitle(
          application.universityName,
          application.courseName,
          application.currentStageName,
        ),
        to: applicationDetailsPath(application.id),
      }));

    return [...leads, ...students, ...applications];
  }, [isSearching, normalizedQuery, leadsQuery.data, studentsQuery.data, applicationsQuery.data]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  const isLoading =
    leadsQuery.isFetching || studentsQuery.isFetching || applicationsQuery.isFetching;

  const openResult = (result: SearchResult) => {
    setInputValue("");
    setQuery("");
    setIsOpen(false);
    navigate(result.to);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openResult(results[highlightedIndex]);
    }
  };

  // Results arrive grouped, so tracking the last one emitted is enough for one heading each.
  let lastGroup = "";

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box
        ref={anchorRef}
        sx={{
          display: { xs: "none", sm: "block" },
          flex: 1,
          maxWidth: 300,
          ml: 1.5,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search leads, students, apps…"
          size="small"
          value={inputValue}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#F7FAFC",
              borderRadius: "9px",
              fontSize: 12,
              height: 34,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ color: "text.disabled", fontSize: 14 }} />
                </InputAdornment>
              ),
              endAdornment: isLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={13} />
                </InputAdornment>
              ) : undefined,
            },
          }}
          onChange={(event) => {
            setInputValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        <Popper
          anchorEl={anchorRef.current}
          open={isOpen && isSearching}
          placement="bottom-start"
          sx={{
            width: anchorRef.current?.clientWidth,
            zIndex: (theme) => theme.zIndex.appBar + 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "#e9eff5",
              borderRadius: "10px",
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
              maxHeight: 380,
              mt: 0.75,
              overflowY: "auto",
            }}
          >
            {results.length === 0 ? (
              <Typography sx={{ color: "text.disabled", fontSize: 12, px: 1.75, py: 1.5 }}>
                {isLoading ? "Searching…" : `No matches for “${query.trim()}”`}
              </Typography>
            ) : (
              <List dense disablePadding>
                {results.map((result, index) => {
                  const isNewGroup = result.group !== lastGroup;
                  lastGroup = result.group;

                  return (
                    <Box key={result.key}>
                      {isNewGroup ? (
                        <ListSubheader
                          disableSticky
                          sx={{
                            color: "text.disabled",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.6px",
                            lineHeight: 2.2,
                            textTransform: "uppercase",
                          }}
                        >
                          {result.group}
                        </ListSubheader>
                      ) : null}

                      <ListItemButton
                        selected={index === highlightedIndex}
                        sx={{ px: 1.75, py: 0.75 }}
                        onClick={() => openResult(result)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <Stack spacing={0.125} sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600 }}>
                            {result.primary}
                          </Typography>
                          {result.secondary ? (
                            <Typography noWrap sx={{ color: "text.disabled", fontSize: 10.5 }}>
                              {result.secondary}
                            </Typography>
                          ) : null}
                        </Stack>
                      </ListItemButton>
                    </Box>
                  );
                })}
              </List>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
