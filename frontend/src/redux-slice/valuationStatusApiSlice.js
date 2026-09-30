
import { apiSlice } from "./apiSlice";
export const valuationStatusApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCampDetails: builder.query({
      query: (data) => ({
        url: `/api/valuationstatus/camp-details`,
        method: "GET",
        params: data
      }),
      providesTags: ['CampDetails'],
    }),
    getSubcodeDetails: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/subcode-details`,
        method: "GET",
        params: params
      }),
      providesTags: ['SubcodeDetails']
    }),
    getExaminerSubcodeDetails: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/examiner-subject-details`,
        method: "GET",
        params: params
      }),
      providesTags: ['ExaminerSubcodeDetails']
    }),
    getChiefSubcodeDetails: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/chief-subject-details`,
        method: "GET",
        params: params
      }),
      providesTags: ['ChiefSubcodeDetails']
    }),
    getRemarksMalpracticeDetails: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/examiner-remarks`,
        method: "GET",
        params: params
      }),
      providesTags: ['ExaminerRemarksDetails']
    }),
    getValuationPendingDetails: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/pending-valuation-details`,
        method: "GET",
        params: params
      }),
      providesTags: ['ValuationPendingDetails']
    }),
    submitPendingAssignment: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/submit-pending-assignment`,
        method: "POST",
        body: data
      }),
      invalidatesTags: ['ValuationPendingDetails']
    }),
    submitExaminerStatusChange: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/update-examiner-status`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ['ExaminerSubcodeDetails']
    }),
    getSubcodeEvaluationStatus: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/subcode_evaluation_status_examiner`,
        method: "GET",
        params: params
      }),
      providesTags: ['SubcodeEvaluationStatus']
    }),
    chiefEvaluationUpdateflg: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/chief-evaluation-update-flg`,
        method: "POST",
        body: data
      }),
      //invalidatesTags: ['ChiefSubcodeDetails', 'ExaminerSubcodeDetails']
    }),

    pendingPaperClear: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/pending-paper-clear`,
        method: "POST",
        body: data
      }),
      invalidatesTags: ['ValuationPendingDetails']
    }),

    PendingReleaseChief: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/pending-release-chief`,
        method: "POST",
        body: data
      }),
      invalidatesTags: ['ValuationPendingDetails']
    }),
    getChiefRemarks: builder.query({
      query: (params) => ({
        url: `api/valuationstatus/chief-remarks`,
        method: "GET",
        params: params
      }),
      providesTags: ['ChiefRemarks']
    }),
    getCampDetailsOverall: builder.query({
      query: (data) => ({
        url: `/api/valuationstatus/camp-details-overall`,
        method: "GET",
        params: data
      }),
      providesTags: ['CampDetailsOverall'],   

  }),
}),
});

export const { useGetCampDetailsQuery, useGetSubcodeDetailsQuery, useGetExaminerSubcodeDetailsQuery, useGetRemarksMalpracticeDetailsQuery, useGetValuationPendingDetailsQuery, useSubmitPendingAssignmentMutation, useGetChiefSubcodeDetailsQuery, useSubmitExaminerStatusChangeMutation, useGetSubcodeEvaluationStatusQuery, useChiefEvaluationUpdateflgMutation, usePendingPaperClearMutation, usePendingReleaseChiefMutation, useGetChiefRemarksQuery, useGetCampDetailsOverallQuery, useLazyGetCampDetailsOverallQuery } = valuationStatusApiSlice;