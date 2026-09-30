import { apiSlice } from './apiSlice';

export const foundationReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFoundationTestCodesForReport: builder.query({
      query: () => ({ url: '/api/foundationreport/test-codes', method: 'GET' }),
      providesTags: ['FoundationReport'],
      keepUnusedDataFor: 300,
    }),

    getFoundationMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/foundationreport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'FoundationReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getFoundationQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/foundationreport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'FoundationReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getFoundationSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/foundationreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'FoundationReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetFoundationTestCodesForReportQuery,
  useGetFoundationMarksByTestCodeQuery,
  useGetFoundationQbDetailsByTestCodeQuery,
  useGetFoundationSubjectWiseStatsByTestCodeQuery,
} = foundationReportApiSlice;
