import { createSlice } from "@reduxjs/toolkit";
import { logoutSuccess } from './authSlice';

if (localStorage.getItem("valuationData") === "undefined" || localStorage.getItem("valuationData") === "null") {
  localStorage.removeItem("valuationData");
}
if (localStorage.getItem("valuationReviewBasicData") === "undefined" || localStorage.getItem("valuationReviewBasicData") === "null") {
  localStorage.removeItem("valuationReviewBasicData");
}
const initialState = {
  valuationData: localStorage.getItem("valuationData") ? JSON.parse(localStorage.getItem("valuationData"))  : null,
  currentSubCode: localStorage.getItem("currentSubCode") ? localStorage.getItem("currentSubCode") : null,
  dashboardData: localStorage.getItem("dashboardData") ? JSON.parse(localStorage.getItem("dashboardData"))  : null,
  chiefValuationData: localStorage.getItem("chiefValuationData") ? JSON.parse(localStorage.getItem("chiefValuationData"))  : null,
  chiefValuationBarcodeData: localStorage.getItem("chiefValuationBarcodeData") ? JSON.parse(localStorage.getItem("chiefValuationBarcodeData"))  : null,
  valuationReviewBasicData: localStorage.getItem("valuationReviewBasicData") ? JSON.parse(localStorage.getItem("valuationReviewBasicData")) : null,
};
const valuationSlice = createSlice({
    name:"valuation",
    initialState,
    reducers:{
        setValuationData: (state, action) => {
            state.valuationData = action.payload
            localStorage.setItem('valuationData', JSON.stringify(action.payload)) 
        },
        clearValuationData: (state) => {
            state.valuationData = null
            localStorage.removeItem('valuationData')
        },
        setCurrentSubCode: (state, action) => {
            state.currentSubCode = action.payload
            localStorage.setItem('currentSubCode', action.payload)
        },
        clearCurrentSubCode: (state) => {
            state.currentSubCode = null
            localStorage.removeItem('currentSubCode')
        },
        setDashboardData: (state, action) => {
            state.dashboardData = action.payload
            localStorage.setItem('dashboardData', JSON.stringify(action.payload))
        },
        clearDashboardData: (state) => {
            state.dashboardData = null
            localStorage.removeItem('dashboardData')
        },
        setChiefValuationData: (state, action) => {
            state.chiefValuationData = action.payload
            localStorage.setItem('chiefValuationData', JSON.stringify(action.payload)) 
        },
        clearChiefValuationData: (state) => {
            state.chiefValuationData = null
            localStorage.removeItem('chiefValuationData')
        },
        setChiefValuationBarcodeData: (state, action) => {
            state.chiefValuationBarcodeData = action.payload
            localStorage.setItem('chiefValuationBarcodeData', JSON.stringify(action.payload)) 
        },
        clearChiefValuationBarcodeData: (state) => {
            state.chiefValuationBarcodeData = null
            localStorage.removeItem('chiefValuationBarcodeData')
        },  
        setValuationReviewBasicData: (state, action) => {
            state.valuationReviewBasicData = action.payload
            localStorage.setItem('valuationReviewBasicData', JSON.stringify(action.payload)) 
        },
        clearValuationReviewBasicData: (state) => {
            state.valuationReviewBasicData = null
            localStorage.removeItem('valuationReviewBasicData')
        },        
    },
    extraReducers: (builder) => {
        builder.addCase(logoutSuccess, (state) => {
            state.valuationData = null;
            state.currentSubCode = null;
            state.dashboardData = null;
            state.chiefValuationData = null;
            state.chiefValuationBarcodeData = null;
            state.valuationReviewBasicData = null;
            localStorage.removeItem('valuationData');
            localStorage.removeItem('currentSubCode');
            localStorage.removeItem('dashboardData');
            localStorage.removeItem('chiefValuationData');
            localStorage.removeItem('chiefValuationBarcodeData');
            localStorage.removeItem('valuationReviewBasicData');
        });
    },
});
export const {setValuationData,clearValuationData,setCurrentSubCode,clearCurrentSubCode,setDashboardData,clearDashboardData,setChiefValuationData,clearChiefValuationData,setChiefValuationBarcodeData,clearChiefValuationBarcodeData,setValuationReviewBasicData,clearValuationReviewBasicData} = valuationSlice.actions;
export default valuationSlice.reducer;
