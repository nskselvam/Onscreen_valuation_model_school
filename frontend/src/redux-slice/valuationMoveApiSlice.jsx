import { apiSlice } from './apiSlice';

export const valuationMoveApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getFileUpload: builder.mutation({
            query: (data) => ({
                url: '/api/valuation-move',
                method: 'POST',
                body: data,
            }),
        }),
        getValuationMoveData: builder.query({
            query: (params) => ({
                url: '/api/valuation-move',
                method: 'GET',
                params: params,
            }),
        }),
        valuationUpdateData: builder.mutation({
            query: (data) => ({
                url: '/api/valuation-move/update',
                method: 'POST',
                body: data,
            }),
        }),
    }),

    
});

export const { useGetFileUploadMutation, useGetValuationMoveDataQuery, useLazyGetValuationMoveDataQuery, useValuationUpdateDataMutation } = valuationMoveApiSlice;