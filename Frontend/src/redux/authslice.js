import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    finishInitialLoad: (state) => {
      state.loading = false;
    }
  },
});

export const { setCredentials, logout, finishInitialLoad } = authSlice.actions;
export default authSlice.reducer;