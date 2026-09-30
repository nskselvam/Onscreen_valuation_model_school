import { apiSlice } from "./apiSlice";

export const NavBarApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        markPassage: builder.mutation({
            query: (data) => ({
                url: `/api/v1/valuation/valuation_data_update`,
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useMarkPassageMutation
} = NavBarApiSlice;
