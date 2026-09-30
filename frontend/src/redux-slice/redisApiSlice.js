import { apiSlice } from "./apiSlice";
export const valuationStatusApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    updateRoleDegree: builder.mutation({
        query: (data) => ({
            url: `api/redis/update-role-degree`,
            method: "POST",
            body: data
        }),
        invalidatesTags: ['ValuationPendingDetails']
    }),

  }),
});

export const {
    useUpdateRoleDegreeMutation,
} = valuationStatusApiSlice;