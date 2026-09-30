import { apiSlice } from "./apiSlice";

export const testMasterApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTestMasters: builder.query({
      query: ({ page = 1, limit = 200, search = '' } = {}) => ({
        url: `/api/testmaster/all`,
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ['TestMaster'],
    }),
    getTestMasterById: builder.query({
      query: (id) => ({
        url: `/api/testmaster/${id}`,
        method: "GET",
      }),
      providesTags: ['TestMaster'],
    }),
    createTestMaster: builder.mutation({
      query: (data) => ({
        url: `/api/testmaster/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['TestMaster'],
    }),
    updateTestMaster: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/testmaster/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ['TestMaster'],
    }),
    deleteTestMaster: builder.mutation({
      query: (id) => ({
        url: `/api/testmaster/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['TestMaster'],
    }),
    deleteTestMarksByTestCode: builder.mutation({
      query: ({ testcode, deleteResult, deleteQB, deleteQBMedium }) => ({
        url: `/api/testmaster/delete-marks/${testcode}`,
        method: "DELETE",
        body: { deleteResult, deleteQB, deleteQBMedium },
      }),
      invalidatesTags: ['TestMaster'],
    }),
    deleteDistrictTestData: builder.mutation({
      query: ({ testcode, districtCodes, deleteResult, deleteQB, deleteQBMedium }) => ({
        url: `/api/testmaster/delete-district-data/${testcode}`,
        method: "DELETE",
        body: { districtCodes, deleteResult, deleteQB, deleteQBMedium },
      }),
      invalidatesTags: ['TestMaster'],
    }),
    toggleDistrictImageStatus: builder.mutation({
      query: (data) => ({
        url: `/api/testmaster/toggle-district-status`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['TestMaster'],
    }),
  }),
});

export const {
  useGetAllTestMastersQuery,
  useGetTestMasterByIdQuery,
  useCreateTestMasterMutation,
  useUpdateTestMasterMutation,
  useDeleteTestMasterMutation,
  useDeleteTestMarksByTestCodeMutation,
  useDeleteDistrictTestDataMutation,
  useToggleDistrictImageStatusMutation,
} = testMasterApiSlice;
