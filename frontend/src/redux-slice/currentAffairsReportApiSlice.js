import { apiSlice } from './apiSlice';

export const currentAffairsReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentAffairsTestCodesForReport: builder.query({
      query: () => ({ url: '/api/currentaffairsreport/test-codes', method: 'GET' }),
      providesTags: ['CurrentAffairsReport'],
      keepUnusedDataFor: 300,
    }),

    getCurrentAffairsMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/currentaffairsreport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'CurrentAffairsReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getCurrentAffairsQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/currentaffairsreport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'CurrentAffairsReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getCurrentAffairsSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/currentaffairsreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'CurrentAffairsReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetCurrentAffairsTestCodesForReportQuery,
  useGetCurrentAffairsMarksByTestCodeQuery,
  useGetCurrentAffairsQbDetailsByTestCodeQuery,
  useGetCurrentAffairsSubjectWiseStatsByTestCodeQuery,
} = currentAffairsReportApiSlice;
