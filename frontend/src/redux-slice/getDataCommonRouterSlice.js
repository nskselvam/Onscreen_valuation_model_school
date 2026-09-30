import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

// Clear invalid localStorage data
if (localStorage.getItem("master_data_admin") === "undefined" || localStorage.getItem("master_data_admin") === "null") {
  localStorage.removeItem("master_data_admin");
}

const initialState = {
  master_data_admin: localStorage.getItem("master_data_admin") ? JSON.parse(localStorage.getItem("master_data_admin"))  : null,
  
  master_data_admin_valid_qbs: localStorage.getItem("master_data_admin_valid_qbs") ? JSON.parse(localStorage.getItem("master_data_admin_valid_qbs"))  : null,
};

const masterDataAdminSlice = createSlice({
    name:"master_data_admin",
    initialState,
    reducers:{
        masterDataAdminDataSubcode: (state, action) => {
            state.master_data_admin = action.payload
            localStorage.setItem('master_data_admin', JSON.stringify(action.payload)) 
        },
        masterDataAdminDataValid_Qbs: (state , action) => {
            state.master_data_admin_valid_qbs = action.payload
            localStorage.setItem('master_data_admin_valid_qbs', JSON.stringify(action.payload)) 
        },
        masterDataAdminDataRemove: (state) => {
            state.master_data_admin = null
            localStorage.removeItem('master_data_admin')
        },
        masterDataAdminDataValid_QbsRemove: (state) => {
            state.master_data_admin_valid_qbs = null
            localStorage.removeItem('master_data_admin_valid_qbs')
        },
    },
    extraReducers: (builder) => {
        builder.addCase(logoutSuccess, (state) => {
            state.master_data_admin = null;
            localStorage.removeItem('master_data_admin');
        });
    },
});


export const {
    masterDataAdminDataSubcode,
    masterDataAdminDataValid_Qbs,
    masterDataAdminDataRemove,
    masterDataAdminDataValid_QbsRemove
} = masterDataAdminSlice.actions;

export default masterDataAdminSlice.reducer