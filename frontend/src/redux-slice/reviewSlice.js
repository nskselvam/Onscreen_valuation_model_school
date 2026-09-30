import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("valuationreview") === "undefined" || localStorage.getItem("valuationreview") === "null") {
  localStorage.removeItem("valuationreview");
}

const initialState = {
  errInfo: localStorage.getItem("valuationreview") ? JSON.parse(localStorage.getItem("valuationreview"))  : null,
};

const valuationreviewSlice = createSlice({
    name:"valuationreview",
    initialState,
    reducers:{
        valuationreviewData: (state, action) => {
            state.errInfo = action.payload
            localStorage.setItem('valuationreview', JSON.stringify(action.payload)) 
        },
        valuationreviewDataRemove: (state) => {
            state.errInfo = null
            localStorage.removeItem('valuationreview')
        },

    },
    extraReducers: (builder) => {
        builder.addCase(logoutSuccess, (state) => {
            state.errInfo = null;
            localStorage.removeItem('valuationreview');
        });
    },
});


export const {valuationreviewData,valuationreviewDataRemove} = valuationreviewSlice.actions;
export default valuationreviewSlice.reducer