import { apiSlice } from './apiSlice';

export const jeeReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all test codes for report dropdown
    getTestCodesForReport: builder.query({
      query: () => ({
        url: '/api/jeereport/test-codes',
        method: 'GET',
      }),
      providesTags: ['JeeReport'],
      // Keep data cached for 5 minutes to avoid repeated server hits
      keepUnusedDataFor: 300,
    }),

    // Get JEE marks by test code
    getJeeMarksByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/jeereport/marks/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'JeeReport', id: testCode }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get field names for dynamic column mapping
    getFieldnames: builder.query({
      query: () => ({
        url: '/api/jeefieldnames/fieldnames',
        method: 'GET',
      }),
      providesTags: ['JeeFieldnames'],
      // Keep data cached for 30 minutes (fieldnames rarely change)
      keepUnusedDataFor: 1800,
    }),

    // Get JEE QB details by test code
    getJeeQbDetailsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/jeereport/qb-details/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'JeeReport', id: `qb-${testCode}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get subject-wise statistics by test code
    getSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/jeereport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'JeeReport', id: `stats-${testCode}-${districtCode || 'all'}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get question statistics by test code
    getQuestionStatisticsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/jeereport/question-stats/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'JeeReport', id: `question-stats-${testCode}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetTestCodesForReportQuery,
  useGetJeeMarksByTestCodeQuery,
  useGetFieldnamesQuery,
  useGetJeeQbDetailsByTestCodeQuery,
  useGetSubjectWiseStatsByTestCodeQuery,
  useGetQuestionStatisticsByTestCodeQuery,
} = jeeReportApiSlice;
