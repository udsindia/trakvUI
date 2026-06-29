import { type PropsWithChildren, useEffect } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { store } from "@/app/store/store";
import { queryClient } from "@/shared/services/query/queryClient";
import { vutrakTheme } from "@/shared/ui/vutrakTheme";

export function AppProviders({ children }: PropsWithChildren) {
  // Enables the optional .vutrak-* utility classes in vutrak-theme.css.
  useEffect(() => {
    document.body.classList.add("theme-vutrak");
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={vutrakTheme}>
          <CssBaseline />
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
