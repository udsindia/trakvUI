import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/app/auth/authSlice";
import { shellReducer } from "@/app/store/slices/shellSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shell: shellReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
