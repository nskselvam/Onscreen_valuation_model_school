import { apiSlice } from "./apiSlice";
export const valuationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getValuationData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/subcode_section`,
        method: "GET",
        params: data,
      }),
    }),
    getValuationBarcodeData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_barcode`,
        method: "GET",
        params: data,
      }),
    }),
    getValuationImageData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_images`,
        method: "GET",
        params: data,
      }),
    }),
    getExaminerValuetionData: builder.mutation({
      query: (data) => ({
        url: `/api/v1/valuation/examminer_valuation_data_get`,
        method: "POST",
        body: data,
      }),
    }),
    sendFrontendFinalizedData: builder.mutation({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_finalize`,
        method: "POST",
        body: data,
      }),
    }),

    getChiefValuationReviewData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_chief`,
        method: "GET",
        params: data,
      }),
    }),

    getvaluation_chief_Barcode_Data: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_chief_barcode`,
        method: "GET",
        params: data,
      }),
    }),
    getEvaluationmarkspreviewdate: builder.query({
        query: (params) => ({
            url: `/api/v1/valuation/valuation_marks_preview_date`,
            method: "GET",
            params: params,
        }),
        keepUnusedDataFor: 0,
    }),

    getValuationDataWithValDataExaminer: builder.query({
      query: (params) => ({
        url: `/api/v1/valuation/valuation_marks_preview_data_examiner`,
        method: "GET",
        params: params,
      }),
      keepUnusedDataFor: 0,
    }),

    generateValuationPdf: builder.mutation({
      query: (data) => ({
        url: `/api/v1/pdf/valuation-report`,
        method: "POST",
        body: data,
        responseHandler: async (response) => {
          if (!response.ok) {
            // Handle error responses
            const text = await response.text();
            try {
              const errorJson = JSON.parse(text);
              throw new Error(errorJson.message || 'Failed to generate PDF');
            } catch (e) {
              throw new Error(text || 'Failed to generate PDF');
            }
          }
          return response.blob();
        },
        cache: 'no-cache',
      }),
    }),
    valuationRemarksMalpractice: builder.mutation({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_remarks_malpractice`,
        method: "POST",
        body: data,
      }),
    }),
    getValuationTimingData: builder.query({
      query: (data) => ({
        url: `/api/v1/valuation/valuation_timing`,
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 0,
    }),
    updateChiefRemarKData: builder.mutation({
      query: (data) => ({
        url: `/api/v1/valuation/Valuation_Chief_Review_Data_Update`,
        method: "POST",
        body: data,
      }),
    }),
    rejectedByChiefData : builder.mutation({
      query: (data) => ({
        url: `/api/v1/valuation/rejected_by_chief`,
        method: "POST",
        body: data,
      }),
    }),
    valuation_chief_remarks_get: builder.query({
      query: (params) => ({
        url: `/api/v1/valuation/valuation_chief_remarks_get`,
        method: "GET",
        params: params,
      }),
      keepUnusedDataFor: 0,
    }),
    valuationGetMarkExaminer: builder.query({
      query: (params) => ({
        url: `/api/v1/valuation/examiner-total-marks`,
        method: "GET",
        params: params,
      }),
      keepUnusedDataFor: 0,
    }),
    valuationCountCheck: builder.mutation({
      query: (params) => ({
        url: `/api/v1/valuation/count_check`,
        method: "GET",
        params: params,
      }),
    }),


  }),
});

export const {
  useGetValuationDataQuery,
  useGetValuationBarcodeDataQuery,
  useGetValuationImageDataQuery,
  useGetExaminerValuetionDataMutation,
  useSendFrontendFinalizedDataMutation,
  useGetChiefValuationReviewDataQuery,
  useGetvaluation_chief_Barcode_DataQuery,
  useGetEvaluationmarkspreviewdateQuery,
  useGetValuationDataWithValDataExaminerQuery,
  useGenerateValuationPdfMutation,
  useValuationRemarksMalpracticeMutation,
  useGetValuationTimingDataQuery,
  useUpdateChiefRemarKDataMutation,
  useRejectedByChiefDataMutation,
  useValuation_chief_remarks_getQuery,
  useValuationGetMarkExaminerQuery,
  useValuationCountCheckMutation,
} = valuationApiSlice;
