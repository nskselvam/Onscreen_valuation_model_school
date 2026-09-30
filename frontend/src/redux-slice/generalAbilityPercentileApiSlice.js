import { apiSlice } from './apiSlice';

export const generalAbilityPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGeneralAbilityTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/generalabilitypercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['GeneralAbilityPercentile'],
      keepUnusedDataFor: 300,
    }),

    getGeneralAbilityPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/generalabilitypercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'GeneralAbilityPercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateGeneralAbilityOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/generalabilitypercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),

    calculateGeneralAbilityDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/generalabilitypercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),

    calculateGeneralAbilityAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/generalabilitypercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),

    revokeGeneralAbilityOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/generalabilitypercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),

    revokeGeneralAbilityDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/generalabilitypercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),

    revokeGeneralAbilityAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/generalabilitypercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['GeneralAbilityPercentile'],
    }),
  }),
});

export const {
  useGetGeneralAbilityTestCodesWithDistrictsQuery,
  useGetGeneralAbilityPercentileStatusQuery,
  useCalculateGeneralAbilityOverallPercentilesMutation,
  useCalculateGeneralAbilityDistrictPercentilesMutation,
  useCalculateGeneralAbilityAllDistrictsPercentilesMutation,
  useRevokeGeneralAbilityOverallPercentilesMutation,
  useRevokeGeneralAbilityDistrictPercentilesMutation,
  useRevokeGeneralAbilityAllDistrictsPercentilesMutation,
} = generalAbilityPercentileApiSlice;