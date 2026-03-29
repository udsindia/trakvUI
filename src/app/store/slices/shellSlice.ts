import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";

type ShellState = {
  mobileNavigationOpen: boolean;
};

const initialState: ShellState = {
  mobileNavigationOpen: false,
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
  },
});

export const {
  openMobileNavigation,
  closeMobileNavigation,
} = shellSlice.actions;

export const selectMobileNavigationOpen = (state: RootState) =>
  state.shell.mobileNavigationOpen;

export const shellReducer = shellSlice.reducer;
