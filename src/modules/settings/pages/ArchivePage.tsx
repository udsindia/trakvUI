import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import FileDownloadRounded from "@mui/icons-material/FileDownloadRounded";
import { httpClient } from "@/shared/services/http/client";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type ArchivedRow = {
  id: string;
  kind: string;
  name: string;
  detail: string;
  status: string;
  archivedAt: string;
};

type ArchiveKind = "leads" | "students" | "applications";

const TABS: { key: ArchiveKind; label: string; empty: string }[] = [
  { key: "leads", label: "Leads", empty: "No archived leads." },
  { key: "students", label: "Students", empty: "No archived students." },
  { key: "applications", label: "Applications", empty: "No archived applications." },
];

/**
 * Everything that has been filed away.
 *
 * Archiving used to mean a record vanished — every working list filters archived rows out
 * and there was nowhere to see them. That made archiving something you could not safely
 * automate, because a rule that archives on your behalf would be hiding records nobody
 * could get back to. This is the other half of that: one page, all three kinds.
 *
 * Read-only, with an export. Restoring a record is a decision about that record and
 * belongs on its own page, not in a list of things you have already put away.
 */
export function ArchivePage() {
  const [kind, setKind] = useState<ArchiveKind>("leads");

  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: ["archive", kind],
    queryFn: async () => {
      const response = await httpClient.get<ArchivedRow[]>(`/archive/${kind}`);
      return response.data ?? [];
    },
  });

  const [exporting, setExporting] = useState(false);

  /**
   * Fetched through the API client rather than opened as a plain link.
   *
   * A bare href would be the simpler thing, but the export endpoint needs the bearer token
   * and an anchor cannot carry one — the browser would arrive unauthenticated and download
   * a 401. So the file comes back through the client and is handed to the browser here.
   */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await httpClient.get(`/archive/export?kind=${kind}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `archive-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Released on the next tick: revoking it synchronously can beat the download.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 0.5 }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Archive</Typography>
        <Button
          disabled={exporting || rows.length === 0}
          size="small"
          startIcon={<FileDownloadRounded />}
          sx={{ textTransform: "none" }}
          variant="outlined"
          onClick={() => void exportCsv()}
        >
          {exporting ? "Preparing…" : `Export ${kind} to CSV`}
        </Button>
      </Stack>

      <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 2, maxWidth: "64ch" }}>
        Records that have been filed away. Nothing here is deleted — archiving keeps a
        record out of the working lists while leaving its history intact. The export opens
        directly in Excel.
      </Typography>

      <Tabs
        sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }}
        value={kind}
        onChange={(_event, next: ArchiveKind) => setKind(next)}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            label={tab.label}
            sx={{ textTransform: "none" }}
            value={tab.key}
          />
        ))}
      </Tabs>

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 5 }}>
          <CircularProgress size={26} />
        </Stack>
      ) : isError ? (
        <Alert severity="error">{getApiErrorMessage(error, "Unable to load the archive.")}</Alert>
      ) : rows.length === 0 ? (
        <Alert severity="info">{TABS.find((tab) => tab.key === kind)?.empty}</Alert>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detail</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Archived</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                    {row.detail || "—"}
                  </TableCell>
                  <TableCell>
                    {row.status ? (
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{ backgroundColor: "#EEF2F6", color: "#55707C", height: 20 }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                    {row.archivedAt || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
