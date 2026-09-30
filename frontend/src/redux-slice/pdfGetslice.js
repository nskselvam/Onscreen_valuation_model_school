
import { apiSlice } from "./apiSlice";
export const pdfApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPdfData: builder.query({
      query: (data) => ({
        url: `/api/v1/pdf/question-paper`,
        method: "POST",
        data: data,
      }),
    }),

    getPdfDataDetails: builder.query({
      query: (data) => ({
        url: `/api/v1/pdf/printpdfdetails`,
        method: "GET",
        params: data
      }),
    }),

    getPdfMarkGenerateCampDetails: builder.query({
      query: (data) => ({
        url: `/api/v1/pdf/mark-generate-camp-details`,
        method: "GET",
        params: data
      }),
    }),

     getMarkDetailsOverall: builder.query({
      query: (data) => ({
        url: `/api/v1/pdf/mark-details-overall`,
        method: "GET",
        params: data
      }),
      providesTags: ['MarkDetailsOverall']
    })
  })
});

export const { 
  useGetPdfDataQuery, 
  useGetPdfDataDetailsQuery, 
  useGetMarkDetailsOverallQuery,
  useLazyGetMarkDetailsOverallQuery ,
  useGetPdfMarkGenerateCampDetailsQuery,
  useLazyGetPdfMarkGenerateCampDetailsQuery
} = pdfApiSlice;
