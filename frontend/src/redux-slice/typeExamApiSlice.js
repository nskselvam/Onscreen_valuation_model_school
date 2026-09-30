import { apiSlice } from "./apiSlice";

export const typeExamApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTypeExams: builder.query({
      query: ({ page = 1, limit = 100, search = '' } = {}) => ({
        url: `/api/typeexam/all`,
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ['TypeExam'],
    }),
    getTypeExamById: builder.query({
      query: (id) => ({
        url: `/api/typeexam/${id}`,
        method: "GET",
      }),
      providesTags: ['TypeExam'],
    }),
    getNextSerialNumber: builder.query({
      query: () => ({
        url: `/api/typeexam/next-serial`,
        method: "GET",
      }),
    }),
    createTypeExam: builder.mutation({
      query: (data) => ({
        url: `/api/typeexam/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['TypeExam'],
    }),
    updateTypeExam: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/typeexam/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ['TypeExam'],
    }),
    deleteTypeExam: builder.mutation({
      query: (id) => ({
        url: `/api/typeexam/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['TypeExam'],
    }),
  }),
});

export const {
  useGetAllTypeExamsQuery,
  useGetTypeExamByIdQuery,
  useGetNextSerialNumberQuery,
  useCreateTypeExamMutation,
  useUpdateTypeExamMutation,
  useDeleteTypeExamMutation,
} = typeExamApiSlice;
