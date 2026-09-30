import { apiSlice } from "./apiSlice";

export const thiyagarayaImportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    thiyagarayaImportUpload: builder.mutation({
      query: (data) => ({
        url: `/api/thiyagaraya-import`,
        method: "POST",
        body: data,
      }),
    }),
    thiyagarayaImageCheck: builder.mutation({
      query: () => ({
        url: `/api/thiyagaraya-import/image-check`,
        method: "GET",
      }),
    }),
    thiyagarayaGetSubjectCode: builder.query({
      query: (data) => ({
        url: `/api/thiyagaraya-import/subject-code`,
        method: "GET",
        params: data,
      }),
    }),
    thiyagarayaGetTableCount: builder.query({
      query: () => ({
        url: `/api/thiyagaraya-import/table-count`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useThiyagarayaImportUploadMutation,
  useThiyagarayaImageCheckMutation,
  useThiyagarayaGetSubjectCodeQuery,
  useThiyagarayaGetTableCountQuery,
} = thiyagarayaImportApiSlice;
