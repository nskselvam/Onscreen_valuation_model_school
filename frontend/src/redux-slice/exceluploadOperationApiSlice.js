import UploadExcel from "../pages/uploadExcel/UploadExcel";
import { apiSlice } from "./apiSlice";
export const exceluploadOperationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTypeExam: builder.query({
      query: () => ({
        url: `/api/excelupload/get_all_type_exam`,
        method: "GET",
      }),
      providesTags: ['UserData'],
    }),
    uploadExcel: builder.mutation({
      query: (formData) => ({
        url: `/api/excelupload/upload_excel`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ['UserData'],
    }),
    enrichTemplateExcelRows: builder.mutation({
      query: (payload) => ({
        url: `/api/template-excel/enrich`,
        method: "POST",
        body: payload,
      }),
    }),
    calculateTemplateStatisticsRows: builder.mutation({
      query: (payload) => ({
        url: `/api/template-excel/statistics`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useGetAllTypeExamQuery, useUploadExcelMutation, useEnrichTemplateExcelRowsMutation, useCalculateTemplateStatisticsRowsMutation } = exceluploadOperationApiSlice;