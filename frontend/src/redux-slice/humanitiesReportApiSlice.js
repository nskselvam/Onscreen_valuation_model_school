import { apiSlice } from './apiSlice';

export const humanitiesReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHumanitiesTestCodesForReport: builder.query({
      query: () => ({ url: '/api/humanitiesreport/test-codes', method: 'GET' }),
      providesTags: ['HumanitiesReport'],
      keepUnusedDataFor: 300,
    }),

    getHumanitiesMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/humanitiesreport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'HumanitiesReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getHumanitiesQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/humanitiesreport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'HumanitiesReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getHumanitiesSubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/humanitiesreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'HumanitiesReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetHumanitiesTestCodesForReportQuery,
  useGetHumanitiesMarksByTestCodeQuery,
  useGetHumanitiesQbDetailsByTestCodeQuery,
  useGetHumanitiesSubjectWiseStatsByTestCodeQuery,
} = humanitiesReportApiSlice;
