import { apiSlice } from './apiSlice';

export const dataExportApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getExportData: builder.mutation({
            query: (params) => ({
                url: '/api/data-export/export',
                method: 'GET',
                params,
            }),
        }),
    }),
});

export const { useGetExportDataMutation } = dataExportApiSlice;
