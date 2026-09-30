import { apiSlice } from './apiSlice';

export const generalAbilityReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGeneralAbilityTestCodesForReport: builder.query({
      query: () => ({ url: '/api/generalabilityreport/test-codes', method: 'GET' }),
      providesTags: ['GeneralAbilityReport'],
      keepUnusedDataFor: 300,
    }),

    getGeneralAbilityMarksByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/generalabilityreport/marks/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'GeneralAbilityReport', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    getGeneralAbilityFieldnames: builder.query({
      query: () => ({ url: '/api/generalabilitydescription/fieldnames', method: 'GET' }),
      providesTags: ['GeneralAbilityReport'],
      keepUnusedDataFor: 1800,
    }),

    getGeneralAbilityQbDetailsByTestCode: builder.query({
      query: (testCode) => ({ url: `/api/generalabilityreport/qb-details/${testCode}`, method: 'GET' }),
      providesTags: (result, error, testCode) => [{ type: 'GeneralAbilityReport', id: `qb-${testCode}` }],
      keepUnusedDataFor: 300,
    }),

    getGeneralAbilitySubjectWiseStatsByTestCode: builder.query({
      query: ({ testCode, districtCode }) => ({
        url: `/api/generalabilityreport/subject-stats/${testCode}`,
        method: 'GET',
        params: districtCode ? { districtCode } : {},
      }),
      providesTags: (result, error, { testCode, districtCode }) => [
        { type: 'GeneralAbilityReport', id: `stats-${testCode}-${districtCode || 'all'}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetGeneralAbilityTestCodesForReportQuery,
  useGetGeneralAbilityMarksByTestCodeQuery,
  useGetGeneralAbilityFieldnamesQuery,
  useGetGeneralAbilityQbDetailsByTestCodeQuery,
  useGetGeneralAbilitySubjectWiseStatsByTestCodeQuery,
} = generalAbilityReportApiSlice;