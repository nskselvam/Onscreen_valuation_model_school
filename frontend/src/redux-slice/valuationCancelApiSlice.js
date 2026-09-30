import { apiSlice } from './apiSlice';

export const valuationCancelApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getValuationCancelData: builder.mutation({
            query: (params) => ({
                url: '/api/valuation-cancel/data',
                method: 'GET',
                params,
            }),
        }),
        deleteValuationRecord: builder.mutation({
            query: (data) => ({
                url: '/api/valuation-cancel/delete',
                method: 'DELETE',
                body: data,
            }),
        }),
    }),
});

export const {
    useGetValuationCancelDataMutation,
    useDeleteValuationRecordMutation,
} = valuationCancelApiSlice;
