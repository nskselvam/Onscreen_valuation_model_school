import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("examinerValuationres") === "undefined" || localStorage.getItem("examinerValuationres") === "null") {
  localStorage.removeItem("examinerValuationres");
}

const initialState = {
  examinerValuationDataSlice: localStorage.getItem("examinerValuationres") ? JSON.parse(localStorage.getItem("examinerValuationres"))  : null,
};

const examinerValuationDataSlice = createSlice({
    name:"examinerValuation",
    initialState,
    reducers:{
        examinerValuationDataInfo: (state, action) => {
            state.examinerValuationDataSlice = action.payload
            localStorage.setItem('examinerValuationres', JSON.stringify(action.payload)) 
        },
        examinerValuationDataRemove: (state) => {
            state.examinerValuationDataSlice = null
            localStorage.removeItem('examinerValuationres')
        },

    },
    extraReducers: (builder) => {
        builder.addCase(logoutSuccess, (state) => {
            state.examinerValuationDataSlice = null;
            localStorage.removeItem('examinerValuationres');
        });
    },
});


export const {examinerValuationDataInfo, examinerValuationDataRemove} = examinerValuationDataSlice.actions;
export default examinerValuationDataSlice.reducer