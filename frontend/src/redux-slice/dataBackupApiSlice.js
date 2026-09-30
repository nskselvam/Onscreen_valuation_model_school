import { apiSlice } from './apiSlice';

export const dataBackupApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBackupTables: builder.query({
            query: () => ({ url: '/api/data-backup/tables', method: 'GET' }),
        }),
    }),
});

export const { useGetBackupTablesQuery } = dataBackupApiSlice;
