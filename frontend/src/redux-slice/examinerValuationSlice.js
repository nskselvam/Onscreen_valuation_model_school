import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

if (localStorage.getItem("examinerValuation") === "undefined" || localStorage.getItem("examinerValuation") === "null") {
  localStorage.removeItem("examinerValuation");
}

const initialState = {
  examinerData: localStorage.getItem("examinerValuation") ? JSON.parse(localStorage.getItem("examinerValuation")) : null,
};

const examinerValuationSlice = createSlice({
  name: "examinerValuation",
  initialState,
  reducers: {
    setExaminerValuationData: (state, action) => {
      state.examinerData = action.payload;
      localStorage.setItem('examinerValuation', JSON.stringify(action.payload));
    },
    clearExaminerValuationData: (state) => {
      state.examinerData = null;
      localStorage.removeItem('examinerValuation');
    }
  },
  extraReducers: (builder) => {
    builder.addCase(logoutSuccess, (state) => {
      state.examinerData = null;
      localStorage.removeItem('examinerValuation');
    });
  },
});

export const { setExaminerValuationData, clearExaminerValuationData } = examinerValuationSlice.actions;
export default examinerValuationSlice.reducer;
