import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f5ad4",
      dark: "#083d94",
      light: "#4f8df0",
    },
    secondary: {
      main: "#00897b",
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

