import { apiSlice } from "./apiSlice";

export const percentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all test codes with their districts
    getTestCodesWithDistricts: builder.query({
      query: () => ({
        url: `/api/percentile/test-codes-with-districts`,
        method: "GET",
      }),
      providesTags: ['Percentile'],
    }),

    // Get percentile status for a specific test code
    getPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/percentile/status/${testCode}`,
        method: "GET",
      }),
      providesTags: (result, error, testCode) => [{ type: 'Percentile', id: testCode }],
    }),

    // Calculate overall percentiles for a test code
    calculateOverallPercentiles: builder.mutation({
      query: (testCode) => ({
        url: `/api/percentile/calculate-overall`,
        method: "POST",
        body: { testCode },
      }),
      invalidatesTags: (result, error, testCode) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),

    // Calculate district-specific percentiles
    calculateDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: `/api/percentile/calculate-district`,
        method: "POST",
        body: { testCode, districtCode },
      }),
      invalidatesTags: (result, error, { testCode }) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),

    // Calculate percentiles for all districts
    calculateAllDistrictsPercentiles: builder.mutation({
      query: (testCode) => ({
        url: `/api/percentile/calculate-all-districts`,
        method: "POST",
        body: { testCode },
      }),
      invalidatesTags: (result, error, testCode) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),

    // Revoke overall percentiles for a test code
    revokeOverallPercentiles: builder.mutation({
      query: (testCode) => ({
        url: `/api/percentile/revoke-overall`,
        method: "POST",
        body: { testCode },
      }),
      invalidatesTags: (result, error, testCode) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),

    // Revoke district-specific percentiles
    revokeDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: `/api/percentile/revoke-district`,
        method: "POST",
        body: { testCode, districtCode },
      }),
      invalidatesTags: (result, error, { testCode }) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),

    // Revoke percentiles for all districts
    revokeAllDistrictsPercentiles: builder.mutation({
      query: (testCode) => ({
        url: `/api/percentile/revoke-all-districts`,
        method: "POST",
        body: { testCode },
      }),
      invalidatesTags: (result, error, testCode) => [
        'Percentile', 
        { type: 'Percentile', id: testCode }
      ],
    }),
  }),
});

export const {
  useGetTestCodesWithDistrictsQuery,
  useGetPercentileStatusQuery,
  useCalculateOverallPercentilesMutation,
  useCalculateDistrictPercentilesMutation,
  useCalculateAllDistrictsPercentilesMutation,
  useRevokeOverallPercentilesMutation,
  useRevokeDistrictPercentilesMutation,
  useRevokeAllDistrictsPercentilesMutation,
} = percentileApiSlice;
