import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { httpClient } from "@/shared/services/http/client";
import { GRADE_STYLES } from "@/modules/universities/partnerAgenciesApi";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";

type PartnerAgencySummary = {
  id: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  universityCount: number;
  lowestCommission?: number | null;
  highestCommission?: number | null;
  bestGrade?: string | null;
};

/** A range where the ends differ, a single figure where they don't, a dash where neither. */
function commissionRange(agency: PartnerAgencySummary): string {
  const { lowestCommission: low, highestCommission: high } = agency;
  if (low == null || high == null) return "—";
  return low === high ? `${low}%` : `${low}–${high}%`;
}

/**
 * Every third-party agency this tenant works with.
 *
 * Agencies are added and ranked on each university's own page, because that is where
 * somebody knows which ones place students there. This is the other view of the same
 * records — one row per agency rather than per arrangement — and the reason they are
 * stored once rather than copied per university: without it, "how many universities does
 * this agency cover, and what is the best deal we have with them?" has no answer.
 *
 * Read-only on purpose. An agency edited here would need its commission edited per
 * university anyway, which is the page you would have to go to regardless.
 */
export function PartnerAgenciesPage() {
  const { data: agencies = [], isLoading, isError, error } = useQuery({
    queryKey: ["partner-agencies", "all"],
    queryFn: async () => {
      const response = await httpClient.get<PartnerAgencySummary[]>("/partner-agencies");
      return response.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={26} />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        {getApiErrorMessage(error, "Unable to load partner agencies.")}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5 }}>Partner Agencies</Typography>
      <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 2.5, maxWidth: "62ch" }}>
        Third-party agencies that place students at your universities. Add them, set their
        commission and rank them on each university&rsquo;s own page — this is the view
        across all of them.
      </Typography>

      {agencies.length === 0 ? (
        <Alert severity="info">
          No agencies yet. Open a university and add one under Partner Agencies.
        </Alert>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Agency</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Universities</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Commission</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Best grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{agency.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                    {agency.contactName || agency.contactEmail || "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {agency.universityCount}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {commissionRange(agency)}
                  </TableCell>
                  <TableCell align="center">
                    {agency.bestGrade ? (
                      <Chip
                        label={agency.bestGrade}
                        size="small"
                        sx={{
                          ...(GRADE_STYLES[agency.bestGrade] ?? {}),
                          fontWeight: 700,
                          height: 20,
                          minWidth: 26,
                        }}
                      />
                    ) : (
                      "—"
                    )}
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
