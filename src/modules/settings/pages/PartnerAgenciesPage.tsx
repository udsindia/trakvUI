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
IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
Tooltip,
  Typography,
} from "@mui/material";
import { httpClient } from "@/shared/services/http/client";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  GRADE_STYLES,
  partnerAgenciesApi,
} from "@/modules/universities/partnerAgenciesApi";
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

  const queryClient = useQueryClient();

  const [editingAgency, setEditingAgency] = useState<PartnerAgencySummary | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
const [emailError, setEmailError] = useState("");
const [phoneError, setPhoneError] = useState("");
const validateContactForm = () => {
  let isValid = true;


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{10}$/;

  if (!emailRegex.test(contactEmail.trim())) {
    setEmailError("Please enter a valid email address.");
    isValid = false;
  } else {
    setEmailError("");
  }

  if (!phoneRegex.test(contactPhone.trim())) {
    setPhoneError("Please enter a valid phone number (10 digits).");
    isValid = false;
  } else {
    setPhoneError("");
  }

  return isValid;
};

 const updateContact = useMutation({
  mutationFn: async () => {
    if (!editingAgency) {
      throw new Error("No agency selected.");
    }

    const universityIds = await partnerAgenciesApi.coverage(
      editingAgency.id
    );

    if (universityIds.length === 0) {
      throw new Error("This agency has no university associations.");
    }

    const existingAgencies = await partnerAgenciesApi.forUniversity(
      universityIds[0]
    );

    const existingAgency = existingAgencies.find(
      (item) => item.partnerAgencyId === editingAgency.id
    );

    if (!existingAgency) {
      throw new Error("Existing agency arrangement not found.");
    }
   


    return partnerAgenciesApi.save(universityIds[0], {
      partnerAgencyId: editingAgency.id,
      contactName: existingAgency.contactName,
      contactEmail,
      contactPhone,
      commissionPercentage: existingAgency.commissionPercentage,
      ranking: existingAgency.ranking,
      notes: existingAgency.notes,
    });
  },

  onSuccess: async () => {
    setEditingAgency(null);

    await queryClient.invalidateQueries({
      queryKey: ["partner-agencies", "all"],
    });

    await queryClient.invalidateQueries({
      queryKey: ["partner-agencies", "tenant"],
    });
  },
});
  const startEdit = (agency: PartnerAgencySummary) => {
  setEditingAgency(agency);
  setContactEmail(agency.contactEmail ?? "");
  setContactPhone(agency.contactPhone ?? "");
  setEmailError("");
  setPhoneError("");
  updateContact.reset();
};

  const deleteAgency = useMutation({
    mutationFn: (agencyId: string) =>
      partnerAgenciesApi.deleteGlobal(agencyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["partner-agencies", "all"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["partner-agencies", "tenant"],
      });
    },
  });

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
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Universities</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Best grade</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
  Actions
</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{agency.name}</TableCell>

<TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
  {agency.contactEmail || "—"}
</TableCell>

<TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
  {agency.contactPhone || "—"}
</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {agency.universityCount}
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
                  <TableCell align="center">
  <Tooltip title="Edit contact details">
    <IconButton
      size="small"
      onClick={() => startEdit(agency)}
    >
      <EditOutlined fontSize="small" />
    </IconButton>
  </Tooltip>

  <Tooltip title="Delete agency">
    <IconButton
      size="small"
      onClick={() => {
        if (
          window.confirm(
            `Delete ${agency.name} from all universities?`,
          )
        ) {
          deleteAgency.mutate(agency.id);
        }
      }}
    >
      <DeleteOutlineRounded fontSize="small" />
    </IconButton>
  </Tooltip>
</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      
<Dialog
  open={Boolean(editingAgency)}
  onClose={() => setEditingAgency(null)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Edit Contact Details</DialogTitle>

  <DialogContent>
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TextField
        fullWidth
        label="Agency Name"
        value={editingAgency?.name ?? ""}
        disabled
      />

      <TextField
        fullWidth
        label="Contact Email"
        type="email"
        value={contactEmail}
        error={Boolean(emailError)}
        helperText={emailError}
        onChange={(event) => {
          setContactEmail(event.target.value);
          setEmailError("");
        }}
      />

      <TextField
        fullWidth
        label="Contact Phone"
        value={contactPhone}
        error={Boolean(phoneError)}
        helperText={phoneError}
        onChange={(event) => {
          setContactPhone(event.target.value);
          setPhoneError("");
        }}
      />
    </Stack>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setEditingAgency(null)}>
      Cancel
    </Button>

    <Button
      variant="contained"
      disabled={updateContact.isPending}
      onClick={() => {
        if (validateContactForm()) {
          updateContact.mutate();
        }
      }}
    >
      {updateContact.isPending ? "Saving..." : "Save"}
    </Button>
  </DialogActions>
</Dialog>
</Box>
);
}
