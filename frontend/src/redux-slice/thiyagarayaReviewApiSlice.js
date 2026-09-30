import { apiSlice } from "./apiSlice";

export const thiyagarayaReviewApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getThiyagarayaReviewData: builder.query({
      query: (data) => ({
        url: "/api/thiyagaraya-review",
        method: "POST",
        body: data,
      }),
    }),
    getThiyagarayaReviewMainData: builder.query({
      query: (data) => ({
        url: "/api/thiyagaraya-review/review-main",
        method: "POST",
        body: data,
      }),
    }),
    getThiyagarayaStudentRemarks: builder.query({
      query: (data) => ({
        url: "/api/thiyagaraya-review/student-remarks",
        method: "POST",
        body: data,
      }),
    }),
    updateThiyagarayaReviewDecision: builder.mutation({
      query: (data) => ({
        url: "/api/thiyagaraya-review/decision",
        method: "POST",
        body: data,
      }),
    }),
    saveThiyagarayaReviewRemark: builder.mutation({
      query: (data) => ({
        url: "/api/thiyagaraya-review/remarks",
        method: "POST",
        body: data,
      }),
    }),
    getThiyagarayaReviewRemark: builder.mutation({
      query: (data) => ({
        url: "/api/thiyagaraya-review/remarks/get",
        method: "POST",
        body: data,
      }),
    }),
    getThiyagarayaCandidateRemarksByDummy: builder.mutation({
      query: (data) => ({
        url: "/api/thiyagaraya-review/candidate-remarks/by-dummy",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetThiyagarayaReviewDataQuery,
  useGetThiyagarayaReviewMainDataQuery,
  useGetThiyagarayaStudentRemarksQuery,
  useUpdateThiyagarayaReviewDecisionMutation,
  useSaveThiyagarayaReviewRemarkMutation,
  useGetThiyagarayaReviewRemarkMutation,
  useGetThiyagarayaCandidateRemarksByDummyMutation,
} = thiyagarayaReviewApiSlice;
