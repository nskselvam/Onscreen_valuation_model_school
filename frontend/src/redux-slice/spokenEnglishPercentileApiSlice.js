import { apiSlice } from './apiSlice';

export const spokenEnglishPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSpokenEnglishTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/spokenenglishpercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['SpokenEnglishPercentile'],
      keepUnusedDataFor: 300,
    }),

    getSpokenEnglishPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/spokenenglishpercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [
        { type: 'SpokenEnglishPercentile', id: testCode }
      ],
      keepUnusedDataFor: 300,
    }),

    calculateSpokenEnglishOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/spokenenglishpercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),

    calculateSpokenEnglishDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/spokenenglishpercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),

    calculateSpokenEnglishAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/spokenenglishpercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),

    revokeSpokenEnglishOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/spokenenglishpercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),

    revokeSpokenEnglishDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/spokenenglishpercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),

    revokeSpokenEnglishAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/spokenenglishpercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['SpokenEnglishPercentile'],
    }),
  }),
});

export const {
  useGetSpokenEnglishTestCodesWithDistrictsQuery,
  useGetSpokenEnglishPercentileStatusQuery,
  useCalculateSpokenEnglishOverallPercentilesMutation,
  useCalculateSpokenEnglishDistrictPercentilesMutation,
  useCalculateSpokenEnglishAllDistrictsPercentilesMutation,
  useRevokeSpokenEnglishOverallPercentilesMutation,
  useRevokeSpokenEnglishDistrictPercentilesMutation,
  useRevokeSpokenEnglishAllDistrictsPercentilesMutation,
} = spokenEnglishPercentileApiSlice;
