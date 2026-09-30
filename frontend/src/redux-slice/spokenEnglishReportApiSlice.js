import { apiSlice } from './apiSlice';

export const spokenEnglishReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSpokenEnglishTestCodesForReport: builder.query({
      query: () => ({ url: '/api/spokenenglishreport/test-codes', method: 'GET' }),
      providesTags: ['SpokenEnglishReport'],
      keepUnusedDataFor: 300,
    }),

    getSpokenEnglishMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/spokenenglishreport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'SpokenEnglishReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getSpokenEnglishQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/spokenenglishreport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'SpokenEnglishReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getSpokenEnglishSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/spokenenglishreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'SpokenEnglishReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetSpokenEnglishTestCodesForReportQuery,
  useGetSpokenEnglishMarksByTestCodeQuery,
  useGetSpokenEnglishQbDetailsByTestCodeQuery,
  useGetSpokenEnglishSubjectWiseStatsByTestCodeQuery,
} = spokenEnglishReportApiSlice;
