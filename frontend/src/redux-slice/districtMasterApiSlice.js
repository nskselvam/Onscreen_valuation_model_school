import { apiSlice } from "./apiSlice";

export const districtMasterApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllDistricts: builder.query({
      query: ({ page = 1, limit = 1000, search = '' } = {}) => ({
        url: `/api/districtmaster?page=${page}&limit=${limit}&search=${search}`,
        method: "GET",
      }),
      providesTags: ["DistrictMaster"],
    }),
    getDistrictById: builder.query({
      query: (id) => ({
        url: `/api/districtmaster/${id}`,
        method: "GET",
      }),
      providesTags: ["DistrictMaster"],
    }),
    createDistrict: builder.mutation({
      query: (data) => ({
        url: "/api/districtmaster",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DistrictMaster"],
    }),
    updateDistrict: builder.mutation({
      query: (data) => ({
        url: `/api/districtmaster/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DistrictMaster"],
    }),
    deleteDistrict: builder.mutation({
      query: (id) => ({
        url: `/api/districtmaster/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DistrictMaster"],
    }),
  }),
});

export const {
  useGetAllDistrictsQuery,
  useGetDistrictByIdQuery,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation,
} = districtMasterApiSlice;
