import { apiSlice } from './apiSlice';

export const clatReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClatTestCodesForReport: builder.query({ query: () => '/api/clatreport/test-codes', providesTags: ['ClatReport'] }),
    getClatMarksByTestCode: builder.query({ query: (testCode) => `/api/clatreport/marks/${testCode}`, providesTags: (result, error, testCode) => [{ type: 'ClatReport', id: testCode }] }),
    getClatQbDetailsByTestCode: builder.query({ query: (testCode) => `/api/clatreport/qb-details/${testCode}`, providesTags: (result, error, testCode) => [{ type: 'ClatReport', id: `qb-${testCode}` }] }),
  }),
});

export const { useGetClatTestCodesForReportQuery, useGetClatMarksByTestCodeQuery, useGetClatQbDetailsByTestCodeQuery } = clatReportApiSlice;
