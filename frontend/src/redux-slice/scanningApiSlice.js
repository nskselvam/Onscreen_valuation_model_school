import { apiSlice } from './apiSlice';

export const scanningApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        checkScanningExcelData: builder.mutation({
            query: (data) => ({
                url: '/api/scanning/check',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const { useCheckScanningExcelDataMutation } = scanningApiSlice;
