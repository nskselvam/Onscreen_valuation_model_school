import { apiSlice } from './apiSlice';

export const quantitativeReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuantitativeTestCodesForReport: builder.query({
      query: () => ({ url: '/api/quantitativereport/test-codes', method: 'GET' }),
      providesTags: ['QuantitativeReport'],
      keepUnusedDataFor: 300,
    }),

    getQuantitativeMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/quantitativereport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'QuantitativeReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getQuantitativeQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/quantitativereport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'QuantitativeReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getQuantitativeSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/quantitativereport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'QuantitativeReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetQuantitativeTestCodesForReportQuery,
  useGetQuantitativeMarksByTestCodeQuery,
  useGetQuantitativeQbDetailsByTestCodeQuery,
  useGetQuantitativeSubjectWiseStatsByTestCodeQuery,
} = quantitativeReportApiSlice;
