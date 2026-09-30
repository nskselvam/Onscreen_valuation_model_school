import { apiSlice } from "./apiSlice";

export const alterationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    alterationData: builder.query({
      query: (data) => ({
        url: "/api/alteration/faculty_data",
        method: "GET",
        params: data,
      }),
    }),
    updateExaminer: builder.mutation({
      query: (body) => ({
        url: "/api/alteration/update_examiner",
        method: "PUT",
        body,
      }),
    }),
    updateSubcodeRow: builder.mutation({
      query: (body) => ({
        url: "/api/alteration/update_subcode_row",
        method: "PATCH",
        body,
      }),
    }),

    updateChiefExaminer: builder.mutation({
      query: (body) => ({
        url: "/api/alteration/update_chief_examiner",
        method: "PUT",
        body,
      }),
    }),
  }),
});

export const {
  useAlterationDataQuery,
  useUpdateExaminerMutation,
  useUpdateSubcodeRowMutation,
  useUpdateChiefExaminerMutation,
} = alterationApiSlice;