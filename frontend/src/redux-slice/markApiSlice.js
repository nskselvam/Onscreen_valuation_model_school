import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("markInpInfo") === "undefined" || localStorage.getItem("markInpInfo") === "null") {
    localStorage.removeItem("markInpInfo");
}

const initialState = {
    markInpInfo: localStorage.getItem("markInpInfo") ? JSON.parse(localStorage.getItem("markInpInfo"))  : {},
};

const markInpInfoSlice = createSlice({
        name:"markInpInfo",
        initialState,
        reducers:{
                markInpInfo: (state, action) => {
                        // Store each mark by its unique id
                        const markId = action.payload.id;
                        state.markInpInfo[markId] = action.payload;
                        localStorage.setItem('markInpInfo', JSON.stringify(state.markInpInfo));
                },
                markInpInfoRemove: (state, action) => {
                        if (action.payload) {
                                // Remove specific mark by id
                                delete state.markInpInfo[action.payload];
                        } else {
                                // Remove all marks
                                state.markInpInfo = {};
                        }
                        localStorage.setItem('markInpInfo', JSON.stringify(state.markInpInfo));
                },

        },
        extraReducers: (builder) => {
                builder.addCase(logoutSuccess, (state) => {
                        state.markInpInfo = {};
                        localStorage.removeItem('markInpInfo');
                });
        },
});


export const {markInpInfo,markInpInfoRemove} = markInpInfoSlice.actions;
export default markInpInfoSlice.reducer