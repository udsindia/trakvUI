import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";

type ShellState = {
  mobileNavigationOpen: boolean;
  sidebarCollapsed: boolean;
};

const initialState: ShellState = {
  mobileNavigationOpen: false,
  sidebarCollapsed: localStorage.getItem("vutrak_sidebar_collapsed") === "1",
};

const shellSlice = createSlice({
  name: "shell",
  initialState,
  reducers: {
    openMobileNavigation: (state) => {
      state.mobileNavigationOpen = true;
    },
    closeMobileNavigation: (state) => {
      state.mobileNavigationOpen = false;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("vutrak_sidebar_collapsed", state.sidebarCollapsed ? "1" : "0");
    },
  },
});

export const {
  openMobileNavigation,
  closeMobileNavigation,
  toggleSidebarCollapsed,
} = shellSlice.actions;

export const selectMobileNavigationOpen = (state: RootState) =>
  state.shell.mobileNavigationOpen;

export const selectSidebarCollapsed = (state: RootState) =>
  state.shell.sidebarCollapsed;

export const shellReducer = shellSlice.reducer;
