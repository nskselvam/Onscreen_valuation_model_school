import { apiSlice } from './apiSlice';

export const currentAffairsPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentAffairsTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/currentaffairspercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['CurrentAffairsPercentile'],
      keepUnusedDataFor: 300,
    }),

    getCurrentAffairsPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/currentaffairspercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'CurrentAffairsPercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateCurrentAffairsOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/currentaffairspercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),

    calculateCurrentAffairsDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/currentaffairspercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),

    calculateCurrentAffairsAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/currentaffairspercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),

    revokeCurrentAffairsOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/currentaffairspercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),

    revokeCurrentAffairsDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/currentaffairspercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),

    revokeCurrentAffairsAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/currentaffairspercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CurrentAffairsPercentile'],
    }),
  }),
});

export const {
  useGetCurrentAffairsTestCodesWithDistrictsQuery,
  useGetCurrentAffairsPercentileStatusQuery,
  useCalculateCurrentAffairsOverallPercentilesMutation,
  useCalculateCurrentAffairsDistrictPercentilesMutation,
  useCalculateCurrentAffairsAllDistrictsPercentilesMutation,
  useRevokeCurrentAffairsOverallPercentilesMutation,
  useRevokeCurrentAffairsDistrictPercentilesMutation,
  useRevokeCurrentAffairsAllDistrictsPercentilesMutation,
} = currentAffairsPercentileApiSlice;
