import { apiSlice } from './apiSlice';

export const cuetReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCuetTestCodesForReport: builder.query({
      query: () => ({
        url: '/api/cuetreport/test-codes',
        method: 'GET',
      }),
      providesTags: ['CuetReport'],
      keepUnusedDataFor: 300,
    }),

    getCuetMarksByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/cuetreport/marks/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'CuetReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getCuetFieldnames: builder.query({
      query: () => ({
        url: '/api/cuetdescription/fieldnames',
        method: 'GET',
      }),
      providesTags: ['CuetReport'],
      keepUnusedDataFor: 1800,
    }),

    getCuetQbDetailsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/cuetreport/qb-details/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'CuetReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getCuetSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/cuetreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'CuetReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),

    getCuetQuestionStatisticsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/cuetreport/question-stats/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'CuetReport', id: `question-stats-${testCode}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetCuetTestCodesForReportQuery,
  useGetCuetMarksByTestCodeQuery,
  useGetCuetFieldnamesQuery,
  useGetCuetQbDetailsByTestCodeQuery,
  useGetCuetSubjectWiseStatsByTestCodeQuery,
  useGetCuetQuestionStatisticsByTestCodeQuery,
} = cuetReportApiSlice;
