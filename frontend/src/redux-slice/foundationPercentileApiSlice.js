import { apiSlice } from './apiSlice';

export const foundationPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFoundationTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/foundationpercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['FoundationPercentile'],
      keepUnusedDataFor: 300,
    }),

    getFoundationPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/foundationpercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'FoundationPercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateFoundationOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/foundationpercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),

    calculateFoundationDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/foundationpercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),

    calculateFoundationAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/foundationpercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),

    revokeFoundationOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/foundationpercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),

    revokeFoundationDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/foundationpercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),

    revokeFoundationAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/foundationpercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['FoundationPercentile'],
    }),
  }),
});

export const {
  useGetFoundationTestCodesWithDistrictsQuery,
  useGetFoundationPercentileStatusQuery,
  useCalculateFoundationOverallPercentilesMutation,
  useCalculateFoundationDistrictPercentilesMutation,
  useCalculateFoundationAllDistrictsPercentilesMutation,
  useRevokeFoundationOverallPercentilesMutation,
  useRevokeFoundationDistrictPercentilesMutation,
  useRevokeFoundationAllDistrictsPercentilesMutation,
} = foundationPercentileApiSlice;
