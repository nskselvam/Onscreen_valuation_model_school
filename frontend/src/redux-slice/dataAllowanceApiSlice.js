import { apiSlice } from "./apiSlice";

export const dataAllowanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all data allowances
    getAllDataAllowances: builder.query({
      query: (depcode) => ({
        url: depcode ? `/api/data-allowance?depcode=${depcode}` : `/api/data-allowance`,
        method: "GET",
      }),
      providesTags: ['DataAllowance'],
    }),

    // Get single data allowance by ID
    getDataAllowanceById: builder.query({
      query: (id) => ({
        url: `/api/data-allowance/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: 'DataAllowance', id }],
    }),

    // Get allowances by department code
    getDataAllowanceByDepcode: builder.query({
      query: (depcode) => ({
        url: `/api/data-allowance/department/${depcode}`,
        method: "GET",
      }),
      providesTags: ['DataAllowance'],
    }),

    // Create new data allowance
    createDataAllowance: builder.mutation({
      query: (data) => ({
        url: `/api/data-allowance`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['DataAllowance'],
    }),

    // Update data allowance
    updateDataAllowance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/data-allowance/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        'DataAllowance',
        { type: 'DataAllowance', id }
      ],
    }),

    // Delete data allowance
    deleteDataAllowance: builder.mutation({
      query: (id) => ({
        url: `/api/data-allowance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['DataAllowance'],
    }),
  }),
});

export const {
  useGetAllDataAllowancesQuery,
  useGetDataAllowanceByIdQuery,
  useGetDataAllowanceByDepcodeQuery,
  useCreateDataAllowanceMutation,
  useUpdateDataAllowanceMutation,
  useDeleteDataAllowanceMutation,
} = dataAllowanceApiSlice;
