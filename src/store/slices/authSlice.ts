import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SessionUser } from "@/lib/auth/session";

export interface AuthState {
  user: SessionUser | null;
  token: string | null;
  hydrated: boolean;
}

export interface AuthCredentials {
  user: SessionUser;
  token: string;
}

const initialState: AuthState = {
  user: null,
  token: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthCredentials>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.hydrated = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.hydrated = true;
    },
    hydrate(
      state,
      action: PayloadAction<{ user: SessionUser | null; token: string | null }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.hydrated = true;
    },
  },
});

export const { setCredentials, logout, hydrate } = authSlice.actions;
export default authSlice.reducer;
