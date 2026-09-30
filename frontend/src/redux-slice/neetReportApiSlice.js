import { apiSlice } from './apiSlice';

export const neetReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all NEET test codes for report dropdown
    getNeetTestCodesForReport: builder.query({
      query: () => ({
        url: '/api/neetreport/test-codes',
        method: 'GET',
      }),
      providesTags: ['NeetReport'],
      // Keep data cached for 5 minutes to avoid repeated server hits
      keepUnusedDataFor: 300,
    }),

    // Get NEET marks by test code
    getNeetMarksByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/neetreport/marks/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'NeetReport', id: testCode }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get field names for NEET dynamic column mapping
    getNeetFieldnames: builder.query({
      query: () => ({
        url: '/api/neetdescription/fieldnames',
        method: 'GET',
      }),
      providesTags: ['NeetReport'],
      // Keep data cached for 30 minutes (fieldnames rarely change)
      keepUnusedDataFor: 1800,
    }),

    // Get NEET QB details by test code
    getNeetQbDetailsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/neetreport/qb-details/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'NeetReport', id: `qb-${testCode}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get subject-wise statistics by test code (Physics, Chemistry, Botany, Zoology)
    getNeetSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/neetreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'NeetReport', id: `stats-${testCode}-${districtCode || 'all'}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get NEET medium-wise question statistics by test code
    getNeetQuestionStatisticsByTestCode: builder.query({
      query: (testCode) => ({
        url: `/api/neetreport/question-stats/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'NeetReport', id: `question-stats-${testCode}` }
      ],
      // Keep data cached for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetNeetTestCodesForReportQuery,
  useGetNeetMarksByTestCodeQuery,
  useGetNeetFieldnamesQuery,
  useGetNeetQbDetailsByTestCodeQuery,
  useGetNeetSubjectWiseStatsByTestCodeQuery,
  useGetNeetQuestionStatisticsByTestCodeQuery,
} = neetReportApiSlice;
