import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store/store";
import { authService, getAuthErrorMessage } from "@/app/auth/authService";
import type { AuthLoginRequest, AuthSession, AuthState } from "@/app/auth/auth.types";

const initialState: AuthState = {
  bootstrapStatus: "idle",
  sessionStatus: "unauthenticated",
  isLoggingIn: false,
  error: null,
  user: null,
  roles: [],
  permissions: [],
  tenant: null,
  tokens: null,
};

function applySession(state: AuthState, session: AuthSession) {
  state.user = session.user;
  state.roles = session.roles;
  state.permissions = session.permissions;
  state.tenant = session.tenant;
  state.tokens = session.tokens;
  state.sessionStatus = "authenticated";
}

function resetSessionState(state: AuthState) {
  state.user = null;
  state.roles = [];
  state.permissions = [];
  state.tenant = null;
  state.tokens = null;
  state.sessionStatus = "unauthenticated";
}

export const initializeAuthSession = createAsyncThunk(
  "auth/initializeSession",
  async () => authService.restoreSession(),
);

export const login = createAsyncThunk<
  AuthSession,
  AuthLoginRequest,
  { rejectValue: string }
>("auth/login", async (request, { rejectWithValue }) => {
  try {
    return await authService.login(request);
  } catch (error) {
    return rejectWithValue(getAuthErrorMessage(error));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  authService.clearSession();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuthSession.pending, (state) => {
        if (state.bootstrapStatus === "idle") {
          state.bootstrapStatus = "initializing";
        }

        state.error = null;
      })
      .addCase(initializeAuthSession.fulfilled, (state, action) => {
        state.bootstrapStatus = "ready";
        state.error = null;

        if (action.payload) {
          applySession(state, action.payload);
          return;
        }

        resetSessionState(state);
      })
      .addCase(initializeAuthSession.rejected, (state) => {
        state.bootstrapStatus = "ready";
        state.error = null;
        resetSessionState(state);
      })
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.bootstrapStatus = "ready";
        state.isLoggingIn = false;
        state.error = null;
        applySession(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.error = action.payload ?? "Unable to login.";
        resetSessionState(state);
      })
      .addCase(logout.fulfilled, (state) => {
        state.bootstrapStatus = "ready";
        state.isLoggingIn = false;
        state.error = null;
        resetSessionState(state);
      });
  },
});

export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthRoles = (state: RootState) => state.auth.roles;
export const selectAuthPermissions = (state: RootState) => state.auth.permissions;
export const selectAuthTenant = (state: RootState) => state.auth.tenant;
export const selectAuthBootstrapStatus = (state: RootState) =>
  state.auth.bootstrapStatus;
export const selectAuthSessionStatus = (state: RootState) =>
  state.auth.sessionStatus;

export const authReducer = authSlice.reducer;
