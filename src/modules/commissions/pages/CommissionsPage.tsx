import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRounded from "@mui/icons-material/KeyboardArrowRightRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { NAVBAR_HEIGHT } from "@/app/layout/Navbar";
import { useAuth } from "@/app/auth/authHooks";
import { PERMISSIONS } from "@/config/permissions/permissions";
import { getApiErrorMessage } from "@/shared/services/http/errorMessage";
import { applicationsApi, type CommissionRow } from "@/modules/applications/applicationsApi";
import { applicationDetailsPath } from "@/modules/applications/applicationsRoutePaths";

type CommissionForm = {
  amount: string;
  currency: string;
  followUpDate: string;
  notes: string;
};

type PaymentForm = {
  amount: string;
  receivedOn: string;
  note: string;
};

type View = "open" | "settled" | "all";

type CommissionStatus = {
  label: string;
  color: "default" | "success" | "info" | "warning";
};

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function money(value: number | null | undefined, currency?: string | null) {
  if (value == null) return "—";
  const amount = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return currency ? `${currency} ${amount}` : amount;
}

function statusOf(row: CommissionRow): CommissionStatus {
  if (row.settledAt) return { label: "Settled", color: "success" };
  if (row.commissionAmount == null) return { label: "To record", color: "warning" };
  if (row.receivedAmount <= 0) return { label: "Awaiting payment", color: "info" };
  if ((row.pendingAmount ?? 0) > 0) return { label: "Part received", color: "info" };
  return { label: "Fully received", color: "success" };
}

/**
 * Sums per currency. Amounts in different currencies are never added together — a total
 * of rupees and pounds is not a number anyone can use — so each tile lists one line per
 * currency instead.
 */
function totalsByCurrency(rows: CommissionRow[]) {
  const totals = new Map<string, { expected: number; received: number; pending: number }>();
  for (const row of rows) {
    const key = row.commissionCurrency || "—";
    const t = totals.get(key) ?? { expected: 0, received: 0, pending: 0 };
    t.expected += Number(row.commissionAmount ?? 0);
    t.received += Number(row.receivedAmount ?? 0);
    // Only what is still owed on open commissions; an overpayment is not negative debt,
    // and a settled commission owes nothing whatever its arithmetic says.
    if (!row.settledAt) t.pending += Math.max(0, Number(row.pendingAmount ?? 0));
    totals.set(key, t);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function StatTile({ label, lines, hint }: { label: string; lines: string[]; hint?: string }) {
  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px", flex: "1 1 160px", minWidth: 0, p: 1.75 }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>
      {lines.length === 0 ? (
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>—</Typography>
      ) : (
        lines.map((line) => (
          <Typography key={line} sx={{ fontSize: 20, fontVariantNumeric: "tabular-nums", fontWeight: 700, lineHeight: 1.3 }}>
            {line}
          </Typography>
        ))
      )}
      {hint ? (
        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

/**
 * Enrolled applications and the commission each brings in.
 *
 * Closing an application as Enrolled lands it here and puts "record commission" on an
 * admin's task list. The university often pays in installments: each is recorded on its
 * row, and received / pending follow from them. "Final amount received" closes the
 * commission and archives the application — and the student, once nothing of theirs is
 * left open.
 */
export function CommissionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermissions } = useAuth();
  const canManage = hasPermissions([PERMISSIONS.COMMISSION_MANAGE]);
  const canArchive = hasPermissions([PERMISSIONS.APPLICATIONS_CLOSE]);

  const [view, setView] = useState<View>("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<CommissionRow | null>(null);
  const [form, setForm] = useState<CommissionForm>({ amount: "", currency: "INR", followUpDate: "", notes: "" });
  const [paying, setPaying] = useState<CommissionRow | null>(null);
  const [payment, setPayment] = useState<PaymentForm>({ amount: "", receivedOn: todayIso(), note: "" });
  const [settling, setSettling] = useState<CommissionRow | null>(null);

  const { data: rows = [], isLoading, isError, error } = useQuery({
    queryKey: ["applications", "commissions"],
    queryFn: applicationsApi.getCommissions,
  });

  const visibleRows = useMemo(
    () => rows.filter((row) => (view === "all" ? true : view === "settled" ? Boolean(row.settledAt) : !row.settledAt)),
    [rows, view],
  );

  const summary = useMemo(() => {
    const totals = totalsByCurrency(visibleRows);
    return {
      expected: totals.filter(([, t]) => t.expected > 0).map(([c, t]) => money(t.expected, c === "—" ? null : c)),
      received: totals.filter(([, t]) => t.received > 0).map(([c, t]) => money(t.received, c === "—" ? null : c)),
      pending: totals.filter(([, t]) => t.pending > 0).map(([c, t]) => money(t.pending, c === "—" ? null : c)),
      toRecord: visibleRows.filter((row) => !row.settledAt && row.commissionAmount == null).length,
      awaiting: visibleRows.filter((row) => !row.settledAt && row.commissionAmount != null).length,
      settled: visibleRows.filter((row) => row.settledAt).length,
    };
  }, [visibleRows]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    queryClient.invalidateQueries({ queryKey: ["archive"] });
  };

  const saveMutation = useMutation({
    mutationFn: (vars: { id: string; form: CommissionForm }) =>
      applicationsApi.updateCommission(vars.id, {
        amount: vars.form.amount.trim() === "" ? null : Number(vars.form.amount),
        currency: vars.form.currency.trim() || null,
        followUpDate: vars.form.followUpDate || null,
        notes: vars.form.notes.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (vars: { id: string; payment: PaymentForm }) =>
      applicationsApi.addCommissionPayment(vars.id, {
        amount: Number(vars.payment.amount),
        receivedOn: vars.payment.receivedOn || todayIso(),
        note: vars.payment.note.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setPaying(null);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (vars: { id: string; paymentId: string }) =>
      applicationsApi.deleteCommissionPayment(vars.id, vars.paymentId),
    onSuccess: invalidate,
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.settleCommission(id),
    onSuccess: () => {
      invalidate();
      setSettling(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.deleteApplication(id),
    onSuccess: invalidate,
  });

  const openEditor = (row: CommissionRow) => {
    saveMutation.reset();
    setForm({
      amount: row.commissionAmount == null ? "" : String(row.commissionAmount),
      currency: row.commissionCurrency ?? "INR",
      followUpDate: row.commissionFollowUpDate ?? "",
      notes: row.commissionNotes ?? "",
    });
    setEditing(row);
  };

  const openPayment = (row: CommissionRow) => {
    paymentMutation.reset();
    const pending = row.pendingAmount != null && row.pendingAmount > 0 ? String(row.pendingAmount) : "";
    setPayment({ amount: pending, receivedOn: todayIso(), note: "" });
    setPaying(row);
  };

  const amountInvalid = form.amount.trim() !== "" && (Number.isNaN(Number(form.amount)) || Number(form.amount) < 0);
  const currencyInvalid = form.currency.trim() !== "" && !/^[A-Za-z]{3}$/.test(form.currency.trim());
  // A date already saved may have passed; only a newly chosen one has to be in the future.
  const dateInvalid = Boolean(form.followUpDate)
    && form.followUpDate !== (editing?.commissionFollowUpDate ?? "")
    && form.followUpDate < todayIso();

  const paymentAmountInvalid = payment.amount.trim() === "" || Number.isNaN(Number(payment.amount)) || Number(payment.amount) <= 0;
  const paymentDateInvalid = Boolean(payment.receivedOn) && payment.receivedOn > todayIso();

  const mutationError =
    archiveMutation.error ?? deletePaymentMutation.error ?? null;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "#e9eff5",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: { lg: `calc(100vh - ${NAVBAR_HEIGHT + 48}px)` },
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: { xs: 1.5, md: 2 }, py: 1.25 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Commissions</Typography>
      </Box>

      <Box sx={{ bgcolor: "#fcfdff", flex: 1, overflow: "auto", px: { xs: 2, md: 2.5 }, py: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1.5 }}
        >
          <Typography color="text.secondary" sx={{ fontSize: 13.5, maxWidth: "70ch" }}>
            Record the probable commission, each installment as it arrives, and mark the final
            amount received to close the entry and move it to the archive.
          </Typography>
          <Tabs
            sx={{ flexShrink: 0, minHeight: 32, "& .MuiTab-root": { minHeight: 32, py: 0.25, textTransform: "none" } }}
            value={view}
            onChange={(_event, next: View) => setView(next)}
          >
            <Tab label="Open" value="open" />
            <Tab label="Settled" value="settled" />
            <Tab label="All" value="all" />
          </Tabs>
        </Stack>

        {/* The dashboard: totals for whatever the Open / Settled / All switch is showing. */}
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <StatTile label="Expected" lines={summary.expected} />
          <StatTile label="Received" lines={summary.received} />
          <StatTile label="Pending" lines={summary.pending} hint="Still owed on open commissions" />
          <StatTile
            label="Applications"
            lines={[String(visibleRows.length)]}
            hint={`${summary.toRecord} to record · ${summary.awaiting} awaiting · ${summary.settled} settled`}
          />
        </Stack>

        {mutationError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {getApiErrorMessage(mutationError, "Something went wrong.")}
          </Alert>
        ) : null}

        {isLoading ? (
          <Stack alignItems="center" sx={{ py: 5 }}>
            <CircularProgress size={26} />
          </Stack>
        ) : isError ? (
          <Alert severity="error">{getApiErrorMessage(error, "Unable to load commissions.")}</Alert>
        ) : visibleRows.length === 0 ? (
          <Alert severity="info">
            {view === "settled" ? "No settled commissions yet." : view === "open" ? "No open commissions." : "No enrolled applications yet."}
          </Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>University / Course</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Enrolled</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Expected</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Received</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Pending</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Follow-up</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => {
                  const status = statusOf(row);
                  const isOpen = expanded === row.id;
                  const editable = canManage && !row.settledAt;
                  const overpaid = row.pendingAmount != null && row.pendingAmount < 0;
                  return (
                    <Fragment key={row.id}>
                      <TableRow hover sx={{ "& > td": { borderBottom: isOpen ? "none" : undefined } }}>
                        <TableCell>
                          <IconButton
                            aria-label={isOpen ? "Hide installments" : "Show installments"}
                            size="small"
                            onClick={() => setExpanded(isOpen ? null : row.id)}
                          >
                            {isOpen ? <KeyboardArrowDownRounded fontSize="small" /> : <KeyboardArrowRightRounded fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.studentName || "—"}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {row.archived ? (
                            row.universityName || "—"
                          ) : (
                            <Box
                              component="button"
                              sx={{ all: "unset", color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                              type="button"
                              onClick={() => navigate(applicationDetailsPath(row.id))}
                            >
                              {row.universityName || "—"}
                            </Box>
                          )}
                          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                            {row.courseName}
                            {row.partnerAgencyName ? ` · via ${row.partnerAgencyName}` : ""}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                          {row.closedAt ? row.closedAt.slice(0, 10) : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                          {money(row.commissionAmount, row.commissionCurrency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                          {money(row.receivedAmount, row.commissionCurrency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                          {row.settledAt
                            ? "—"
                            : overpaid
                              ? `Over by ${money(-(row.pendingAmount ?? 0), row.commissionCurrency)}`
                              : money(row.pendingAmount, row.commissionCurrency)}
                        </TableCell>
                        <TableCell sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                          {row.commissionFollowUpDate ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Chip color={status.color} label={status.label} size="small" sx={{ height: 20 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          {editable && (
                            <Button size="small" sx={{ textTransform: "none" }} onClick={() => openEditor(row)}>
                              {row.commissionAmount == null ? "Record" : "Edit"}
                            </Button>
                          )}
                          {canArchive && !row.archived && !row.settledAt && (
                            <Button
                              color="inherit"
                              disabled={archiveMutation.isPending}
                              size="small"
                              sx={{ textTransform: "none" }}
                              onClick={() => archiveMutation.mutate(row.id)}
                            >
                              Archive
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={10} sx={{ py: 0 }}>
                          <Collapse unmountOnExit in={isOpen} timeout="auto">
                            <Box sx={{ pb: 2, pl: 6, pt: 1 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Installments</Typography>
                              {row.payments.length === 0 ? (
                                <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>
                                  Nothing received yet.
                                </Typography>
                              ) : (
                                <Table size="small" sx={{ maxWidth: 560, mb: 1 }}>
                                  <TableBody>
                                    {row.payments.map((p, index) => (
                                      <TableRow key={p.id}>
                                        <TableCell sx={{ color: "text.secondary", fontSize: 13, width: 36 }}>#{index + 1}</TableCell>
                                        <TableCell sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{p.receivedOn}</TableCell>
                                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                                          {money(p.amount, row.commissionCurrency)}
                                        </TableCell>
                                        <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>{p.note || ""}</TableCell>
                                        <TableCell align="right" sx={{ width: 40 }}>
                                          {editable ? (
                                            <IconButton
                                              aria-label="Remove installment"
                                              disabled={deletePaymentMutation.isPending}
                                              size="small"
                                              onClick={() => deletePaymentMutation.mutate({ id: row.id, paymentId: p.id })}
                                            >
                                              <DeleteOutlineRounded fontSize="small" />
                                            </IconButton>
                                          ) : null}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                              {row.commissionNotes ? (
                                <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1 }}>
                                  Notes: {row.commissionNotes}
                                </Typography>
                              ) : null}
                              {row.settledAt ? (
                                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                  Final amount received on {row.settledAt.slice(0, 10)}. This entry is closed.
                                </Typography>
                              ) : editable ? (
                                <Stack direction="row" spacing={1}>
                                  <Button size="small" sx={{ textTransform: "none" }} variant="outlined" onClick={() => openPayment(row)}>
                                    Add installment
                                  </Button>
                                  <Button
                                    color="success"
                                    disabled={row.payments.length === 0}
                                    size="small"
                                    sx={{ textTransform: "none" }}
                                    variant="contained"
                                    onClick={() => {
                                      settleMutation.reset();
                                      setSettling(row);
                                    }}
                                  >
                                    Final amount received
                                  </Button>
                                </Stack>
                              ) : null}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Expected commission and follow-up */}
      <Dialog fullWidth maxWidth="xs" open={editing !== null} onClose={() => setEditing(null)}>
        <DialogTitle>Commission — {editing?.studentName || editing?.universityName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1.5}>
              <TextField
                error={amountInvalid}
                helperText={amountInvalid ? "Enter a positive number" : " "}
                label="Probable amount"
                size="small"
                sx={{ flex: 1 }}
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <TextField
                error={currencyInvalid}
                helperText={currencyInvalid ? "3 letters" : " "}
                label="Currency"
                size="small"
                sx={{ width: 110 }}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                slotProps={{ htmlInput: { maxLength: 3 } }}
              />
            </Stack>
            <TextField
              error={dateInvalid}
              helperText={dateInvalid ? "Pick today or a later date" : "A task is created for you on this date"}
              label="Follow-up date"
              size="small"
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayIso() } }}
            />
            <TextField
              multiline
              label="Notes"
              minRows={2}
              size="small"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            {saveMutation.isError && (
              <Alert severity="error">{getApiErrorMessage(saveMutation.error, "Could not save.")}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            disabled={amountInvalid || currencyInvalid || dateInvalid || saveMutation.isPending}
            variant="contained"
            onClick={() => editing && saveMutation.mutate({ id: editing.id, form })}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* One installment */}
      <Dialog fullWidth maxWidth="xs" open={paying !== null} onClose={() => setPaying(null)}>
        <DialogTitle>Installment received — {paying?.studentName || paying?.universityName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              error={payment.amount.trim() !== "" && paymentAmountInvalid}
              helperText={
                paying?.pendingAmount != null && paying.pendingAmount > 0
                  ? `Pending: ${money(paying.pendingAmount, paying.commissionCurrency)}`
                  : " "
              }
              label={`Amount${paying?.commissionCurrency ? ` (${paying.commissionCurrency})` : ""}`}
              size="small"
              type="number"
              value={payment.amount}
              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
            />
            <TextField
              error={paymentDateInvalid}
              helperText={paymentDateInvalid ? "Cannot be in the future" : " "}
              label="Received on"
              size="small"
              type="date"
              value={payment.receivedOn}
              onChange={(e) => setPayment({ ...payment, receivedOn: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso() } }}
            />
            <TextField
              label="Note (reference, bank, etc.)"
              size="small"
              value={payment.note}
              onChange={(e) => setPayment({ ...payment, note: e.target.value })}
            />
            {paymentMutation.isError && (
              <Alert severity="error">{getApiErrorMessage(paymentMutation.error, "Could not save.")}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaying(null)}>Cancel</Button>
          <Button
            disabled={paymentAmountInvalid || paymentDateInvalid || paymentMutation.isPending}
            variant="contained"
            onClick={() => paying && paymentMutation.mutate({ id: paying.id, payment })}
          >
            {paymentMutation.isPending ? "Saving…" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Final amount received */}
      <Dialog fullWidth maxWidth="xs" open={settling !== null} onClose={() => setSettling(null)}>
        <DialogTitle>Final amount received?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 14 }}>
            Received {money(settling?.receivedAmount, settling?.commissionCurrency)}
            {settling?.commissionAmount != null
              ? ` of ${money(settling.commissionAmount, settling.commissionCurrency)} expected`
              : ""}
            . This closes the commission and moves the application to the archive. It can no
            longer be edited afterwards.
          </DialogContentText>
          {settling?.pendingAmount != null && settling.pendingAmount > 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {money(settling.pendingAmount, settling.commissionCurrency)} is still pending. Settling now
              treats what was received as final.
            </Alert>
          ) : null}
          {settleMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getApiErrorMessage(settleMutation.error, "Could not settle.")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettling(null)}>Cancel</Button>
          <Button
            color="success"
            disabled={settleMutation.isPending}
            variant="contained"
            onClick={() => settling && settleMutation.mutate(settling.id)}
          >
            {settleMutation.isPending ? "Closing…" : "Close and archive"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
