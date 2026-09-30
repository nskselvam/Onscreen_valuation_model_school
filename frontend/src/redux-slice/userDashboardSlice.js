
import { apiSlice } from "./apiSlice";

export const valuationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getValuationfetchData: builder.query({
            query: (data) => ({
                url: `/api/dashboard/subcode_fetch`,
                method: "POST",
                body: data,
            }),
        }),
        getDashboarddatasubcode: builder.query({
            query: (data) => ({
                url: `/api/dashboard/dashboard-data-subcode`,
                method: "POST",
                body: data,
            }),
        }),

        getDashboarddatasubcodechief: builder.query({
            query: (data) => ({
                url: `/api/dashboard/dashboard-data-subcode-chief`,
                method: "GET",
                params: data,
            }),
        }),
        getUserBankDetails: builder.query({
            query: (data) => ({
                url: `/api/dashboard/user/bank-details`,
                method: "GET",
                params: data,
            }),
        }),
        getUserBankDetailsStaff: builder.query({
            query: (data) => ({
                url: `/api/dashboard/user/bank-details-staff`,
                method: "GET",
                params: data,
            }),
        }),

        postUserBankDetailsUpdate: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/user/bank-details`,
                method: "POST",
                body: data,
            }),
        }),
        getEvaluatorDetailsSubjectCount: builder.query({
            query: (data) => ({
                url: `/api/dashboard/user/evaluator-details-subjectcount`,
                method: "GET",
                params: data,
            }),
        }),
            getTadaAllowance: builder.query({
            query: (data) => ({
                url: `/api/dashboard/tada-allowance`,
                method: "GET",
                params: data,
            }),
        }),
        postExaminerPaymentChallan: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/examiner-payment-challan`,
                method: "POST",
                body: data,
                responseHandler: (response) =>
                    response.ok ? response.blob() : response.json(),
                cache: 'no-cache',
            }),
        }),

        getCampusDetails: builder.query({
            query: (data) => ({
                url: `/api/dashboard/campus-details`,
                method: "GET",
                params: data,
            }),
        }),

        getAdminDashboardChartData: builder.query({
            query: (data) => ({
                url: `/api/dashboard/admindashboard-chart-data`,
                method: "POST",
                body: data,
            }),
        }),

        examinerPaymentUpdate: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/examiner-payment-update`,
                method: "POST",
                body: data,
            }),
        }),
        getexaminerPaymentDetails: builder.query({
            query: (data) => ({
                url: `/api/dashboard/examiner-payment-details`,
                method: "GET",
                params: data,
            }),
        }),
        deleteExaminerPayment: builder.mutation({
            query: (id) => ({
                url: `/api/dashboard/examiner-payment-master/${id}`,
                method: "DELETE",
            }),
        }),
        getChiefEvaluatorDetailsSubjectCount: builder.query({
            query: (data) => ({
                url: `/api/dashboard/user/chief-evaluator-details-subjectcount`,
                method: "GET",
                params: data,
            }),
        }),
                chiefEvaluatorPaymentUpdate: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/chief-evaluator-payment-update`,
                method: "POST",
                body: data,
            }),
        }),
        postBankDetailsIfscUpsert: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/user/bank-details-ifsc`,
                method: "POST",
                body: data,
            }),
        }),
        postBankifscUpdateconsolidated: builder.mutation({
            query: (data) => ({
                url: `/api/dashboard/user/bank-details-ifsc-consolidated`,
                method: "POST",
                body: data,
            }),
        }),
        
    }),
});
export const { useGetAdminDashboardChartDataQuery, useGetCampusDetailsQuery, useGetValuationfetchDataQuery, useGetDashboarddatasubcodeQuery, useGetDashboarddatasubcodechiefQuery, useGetUserBankDetailsQuery, useGetUserBankDetailsStaffQuery, usePostUserBankDetailsUpdateMutation , useGetEvaluatorDetailsSubjectCountQuery, useGetTadaAllowanceQuery, usePostExaminerPaymentChallanMutation, useExaminerPaymentUpdateMutation, useChiefEvaluatorPaymentUpdateMutation, useGetexaminerPaymentDetailsQuery, useDeleteExaminerPaymentMutation,useGetChiefEvaluatorDetailsSubjectCountQuery, usePostBankDetailsIfscUpsertMutation, usePostBankifscUpdateconsolidatedMutation } = valuationApiSlice;