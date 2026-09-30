import { apiSlice } from './apiSlice';

export const clatPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClatTestCodesWithDistricts: builder.query({
      query: () => ({ url: '/api/clatpercentile/test-codes-with-districts', method: 'GET' }),
      providesTags: ['ClatPercentile'],
      keepUnusedDataFor: 300,
    }),
    calculateClatOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({ url: '/api/clatpercentile/calculate-overall', method: 'POST', body: { testCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
    calculateClatDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({ url: '/api/clatpercentile/calculate-district', method: 'POST', body: { testCode, districtCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
    calculateClatAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({ url: '/api/clatpercentile/calculate-all-districts', method: 'POST', body: { testCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
    revokeClatOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({ url: '/api/clatpercentile/revoke-overall', method: 'POST', body: { testCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
    revokeClatDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({ url: '/api/clatpercentile/revoke-district', method: 'POST', body: { testCode, districtCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
    revokeClatAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({ url: '/api/clatpercentile/revoke-all-districts', method: 'POST', body: { testCode } }),
      invalidatesTags: ['ClatPercentile'],
    }),
  }),
});

export const {
  useGetClatTestCodesWithDistrictsQuery,
  useCalculateClatOverallPercentilesMutation,
  useCalculateClatDistrictPercentilesMutation,
  useCalculateClatAllDistrictsPercentilesMutation,
  useRevokeClatOverallPercentilesMutation,
  useRevokeClatDistrictPercentilesMutation,
  useRevokeClatAllDistrictsPercentilesMutation,
} = clatPercentileApiSlice;
