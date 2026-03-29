import type { PropsWithChildren } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { store } from "@/app/store/store";
import { queryClient } from "@/shared/services/query/queryClient";
import { appTheme } from "@/shared/ui/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

