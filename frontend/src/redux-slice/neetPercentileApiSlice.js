import { apiSlice } from './apiSlice';

export const neetPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all NEET test codes with districts for percentile calculation
    getNeetTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/neetpercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['NeetPercentile'],
      keepUnusedDataFor: 300,
    }),

    // Get percentile calculation status for a test code
    getNeetPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/neetpercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'NeetPercentile', id: testCode }
      ],
      keepUnusedDataFor: 300,
    }),

    // Calculate overall percentiles for a test code
    calculateNeetOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/neetpercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),

    // Calculate district-specific percentiles
    calculateNeetDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/neetpercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),

    // Calculate percentiles for all districts in a test code
    calculateNeetAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/neetpercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),

    // Revoke overall percentiles for a test code
    revokeNeetOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/neetpercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),

    // Revoke district-specific percentiles
    revokeNeetDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/neetpercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),

    // Revoke percentiles for all districts in a test code
    revokeNeetAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/neetpercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['NeetPercentile', 'NeetReport'],
    }),
  }),
});

export const {
  useGetNeetTestCodesWithDistrictsQuery,
  useGetNeetPercentileStatusQuery,
  useCalculateNeetOverallPercentilesMutation,
  useCalculateNeetDistrictPercentilesMutation,
  useCalculateNeetAllDistrictsPercentilesMutation,
  useRevokeNeetOverallPercentilesMutation,
  useRevokeNeetDistrictPercentilesMutation,
  useRevokeNeetAllDistrictsPercentilesMutation,
} = neetPercentileApiSlice;
