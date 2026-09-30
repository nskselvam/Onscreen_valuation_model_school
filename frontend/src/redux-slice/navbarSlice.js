import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("navbar") === "undefined" || localStorage.getItem("navbar") === "null") {
  localStorage.removeItem("navbar");
}

const initialState = {
  // keep navbar data under `navbar` and track any error in `errInfo`
  navbar: localStorage.getItem("navbar") ? JSON.parse(localStorage.getItem("navbar")) : null,
  errInfo: null,
};

const navbarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    NavDataInfo: (state, action) => {
      state.navbar = action.payload;
      state.errInfo = null;
      if (action.payload !== null && action.payload !== undefined) {
        try {
          localStorage.setItem("navbar", JSON.stringify(action.payload));
        } catch (e) {
          state.errInfo = e.message || "Failed to save navbar to localStorage";
        }
      } else {
        localStorage.removeItem("navbar");
      }
    },
    navRemove: (state) => {
      state.navbar = null;
      state.errInfo = null;
      localStorage.removeItem("navbar");
    },
    setNavError: (state, action) => {
      state.errInfo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutSuccess, (state) => {
      state.navbar = null;
      state.errInfo = null;
      localStorage.removeItem("navbar");
    });
  },
});

export const { NavDataInfo, navRemove, setNavError } = navbarSlice.actions;
export default navbarSlice.reducer;