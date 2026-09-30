import { apiSlice } from "./apiSlice";

export const reviewapiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReviewData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/examiner_review_data`,
        method: "GET",
        params: data
      }),
    }),
    getReviewMarkData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/examiner_review_value_data`,
        method: "GET",
        params: data
      }),
    }),
    getPaperReviewData: builder.query({
      query: (data) => ({
        url: `/api/paper-review`,
        method: "GET",
        params: data
      }),
    }),
    getPaperReviewDataByExaminer: builder.query({
      query: (data) => ({
        url: `/api/paper-review/paper-review-examiner`,
        method: "GET",
        params: data
      }),
    }),
    paperReviewDownload: builder.mutation({
      query: (data) => ({
        url: `/api/paper-review/download`,
        method: "POST",
        body: data,
        headers: { 'Content-Type': 'application/json' },
        responseHandler: (response) => response.blob(),
      }),
    }),
    getPaperReviewZero: builder.query({
      query: (data) => ({
        url: `/api/paper-review/paper-review-zero`,
        method: "GET",
        params: data,
      }),
    }),
    searchPaperReviewBarcode: builder.query({
      query: (data) => ({
        url: `/api/paper-review/search-barcode`,
        method: "GET",
        params: data,
      }),
    }),
    paperReviewMailSend: builder.mutation({
      query: (data) => ({
        url: `/api/paper-review/paper-mail-send`,
        method: "POST",
        body: data,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  }),
});

export const { 
  useGetReviewDataQuery,
  useGetReviewMarkDataQuery,
  useGetPaperReviewDataQuery,
  useGetPaperReviewDataByExaminerQuery,
  usePaperReviewDownloadMutation,
  useLazyGetPaperReviewZeroQuery,
  useLazySearchPaperReviewBarcodeQuery,
  usePaperReviewMailSendMutation,
} = reviewapiSlice;
