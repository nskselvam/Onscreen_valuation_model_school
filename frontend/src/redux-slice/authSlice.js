import { createSlice } from "@reduxjs/toolkit";

// Safe localStorage parser — prevents app crash on malformed / tampered JSON
const safeParseLocalStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") {
      localStorage.removeItem(key);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (key === "userInfo" && parsed && typeof parsed === "object") {
      if (!parsed.username) parsed.username = parsed.User_Id || '';
      if (!parsed.name) parsed.name = parsed.User_Name || '';
      if (!parsed.selected_role) parsed.selected_role = parsed.Role || '';
      if (!parsed.selected_course) parsed.selected_course = parsed.D_Code || '';
    }
    return parsed;
  } catch {
    localStorage.removeItem(key); // purge corrupted entry
    return null;
  }
};

const initialState = {
  userInfo: safeParseLocalStorage("userInfo"),
  regulationInfo: safeParseLocalStorage("regulationInfo"),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const raw = action.payload || {};
            const normalized = {
              ...raw,
              username: raw.username || raw.User_Id || '',
              name: raw.name || raw.User_Name || '',
              selected_role: raw.selected_role || raw.Role || '',
              selected_course: raw.selected_course || raw.D_Code || '',
            };
            state.userInfo = normalized;
            localStorage.setItem('userInfo', JSON.stringify(normalized));
        },
        setRegulationInfo: (state, action) => {
            state.regulationInfo = action.payload;
            localStorage.setItem('regulationInfo', JSON.stringify(action.payload));
        },
        logoutSuccess: (state) => {
            state.userInfo = null;
            state.regulationInfo = null;
            localStorage.removeItem('userInfo');
            localStorage.removeItem('regulationInfo');
        },
        checkAuth: (state) => {
            state.isAuthenticated = !!localStorage.getItem('userInfo');
        }
    },
});

export const { loginSuccess, logoutSuccess, checkAuth, setRegulationInfo } = authSlice.actions;
export default authSlice.reducer;
