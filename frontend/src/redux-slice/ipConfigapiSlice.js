import { apiSlice } from "./apiSlice";


export const CommonApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        commongetData: builder.query({
            query: (data) => ({
                url: `/api/ip-config/ip-data`,
                method: "GET",

            })
        }),
        commonUpdateData: builder.mutation({
            query: (data) => ({
                url: `/api/ip-config/ip-update`,
                method: "POST",
                body: data,
            }),
        }),
        commonipAddData: builder.mutation({
            query: (data) => ({
                url: `/api/ip-config/ip-add`,
                method: "POST",
                body: data,
            }),
        }),
    })
})

export const { useCommongetDataQuery, useCommonUpdateDataMutation,useCommonipAddDataMutation } = CommonApiSlice;