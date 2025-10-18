import { User } from "@/types/user.types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        user: User;
      }>
    ) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    logoutAccount: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = "";
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, logoutAccount, setUser, setAccessToken } =
  authSlice.actions;

export default authSlice.reducer;
