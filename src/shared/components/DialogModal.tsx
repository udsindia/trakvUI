import type { FormEventHandler, ReactNode } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  type DialogProps,
} from "@mui/material";

type DialogModalProps = {
  actions?: ReactNode;
  children: ReactNode;
  maxHeight?: string;
  maxWidth?: DialogProps["maxWidth"];
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export function DialogModal({
  actions,
  children,
  maxHeight = "min(760px, calc(100vh - 48px))",
  maxWidth = "sm",
  open,
  title,
  onClose,
  onSubmit,
}: DialogModalProps) {
  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      open={open}
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            maxHeight,
            overflow: "hidden",
          },
        },
      }}
      onClose={onClose}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          flex: "0 0 auto",
          pb: 1.5,
          pr: 7,
        }}
      >
        {typeof title === "string" ? (
          <Typography sx={{ fontWeight: 700 }} variant="h5">
            {title}
          </Typography>
        ) : (
          title
        )}
        <IconButton
          aria-label="Close dialog"
          sx={{ position: "absolute", right: 16, top: 16 }}
          onClick={onClose}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box
        component={onSubmit ? "form" : "div"}
        sx={{ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: 0 }}
        {...(onSubmit
          ? {
              noValidate: true,
              onSubmit,
            }
          : {})}
      >
        <DialogContent
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
          }}
        >
          {children}
        </DialogContent>

        {actions ? (
          <DialogActions
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              flex: "0 0 auto",
              px: { xs: 2.5, sm: 3 },
              pb: 3,
              pt: 2,
            }}
          >
            {actions}
          </DialogActions>
        ) : null}
      </Box>
    </Dialog>
  );
}
