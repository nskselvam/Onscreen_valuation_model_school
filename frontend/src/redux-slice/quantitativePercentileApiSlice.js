import { apiSlice } from './apiSlice';

export const quantitativePercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuantitativeTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/quantitativepercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['QuantitativePercentile'],
      keepUnusedDataFor: 300,
    }),

    getQuantitativePercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/quantitativepercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'QuantitativePercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateQuantitativeOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/quantitativepercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),

    calculateQuantitativeDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/quantitativepercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),

    calculateQuantitativeAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/quantitativepercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),

    revokeQuantitativeOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/quantitativepercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),

    revokeQuantitativeDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/quantitativepercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),

    revokeQuantitativeAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/quantitativepercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['QuantitativePercentile'],
    }),
  }),
});

export const {
  useGetQuantitativeTestCodesWithDistrictsQuery,
  useGetQuantitativePercentileStatusQuery,
  useCalculateQuantitativeOverallPercentilesMutation,
  useCalculateQuantitativeDistrictPercentilesMutation,
  useCalculateQuantitativeAllDistrictsPercentilesMutation,
  useRevokeQuantitativeOverallPercentilesMutation,
  useRevokeQuantitativeDistrictPercentilesMutation,
  useRevokeQuantitativeAllDistrictsPercentilesMutation,
} = quantitativePercentileApiSlice;
