import { type PropsWithChildren, useEffect, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { store } from "@/app/store/store";
import { queryClient } from "@/shared/services/query/queryClient";
import { ThemeSwitcher } from "@/shared/ui/ThemeSwitcher";
import {
  type AppMode,
  type AppThemeName,
  getInitialMode,
  getInitialThemeName,
  resolveTheme,
  saveMode,
  saveThemeName,
  supportsDark,
} from "@/shared/ui/themeConfig";

export function AppProviders({ children }: PropsWithChildren) {
  const [themeName, setThemeName] = useState<AppThemeName>(getInitialThemeName);
  const [mode, setMode] = useState<AppMode>(getInitialMode);

  useEffect(() => {
    document.body.classList.toggle("theme-gemini", themeName === "gemini");
    saveThemeName(themeName);
  }, [themeName]);

  useEffect(() => {
    saveMode(mode);
    document.documentElement.style.colorScheme = mode; // native form controls / scrollbars
  }, [mode]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={resolveTheme(themeName, mode)}>
          <CssBaseline />
          <AuthProvider>{children}</AuthProvider>
          <ThemeSwitcher
            value={themeName}
            onChange={setThemeName}
            mode={mode}
            onModeChange={setMode}
            darkAvailable={supportsDark(themeName)}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
