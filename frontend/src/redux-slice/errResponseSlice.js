import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("errInfo") === "undefined" || localStorage.getItem("errInfo") === "null") {
  localStorage.removeItem("errInfo");
}

const initialState = {
  errInfo: localStorage.getItem("errInfo") ? JSON.parse(localStorage.getItem("errInfo"))  : null,
};

const errDataInfoSlice = createSlice({
    name:"errinfo",
    initialState,
    reducers:{
        errDataInfo: (state, action) => {
            state.errInfo = action.payload
            localStorage.setItem('errInfo', JSON.stringify(action.payload)) 
        },
        errRemove: (state) => {
            state.errInfo = null
            localStorage.removeItem('errInfo')
        },

    },
    extraReducers: (builder) => {
        builder.addCase(logoutSuccess, (state) => {
            state.errInfo = null;
            localStorage.removeItem('errInfo');
        });
    },
});


export const {errDataInfo,errRemove} = errDataInfoSlice.actions;
export default errDataInfoSlice.reducer