import { apiSlice } from './apiSlice';

export const humanitiesPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHumanitiesTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/humanitiespercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['HumanitiesPercentile'],
      keepUnusedDataFor: 300,
    }),

    getHumanitiesPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/humanitiespercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'HumanitiesPercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateHumanitiesOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/humanitiespercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),

    calculateHumanitiesDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/humanitiespercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),

    calculateHumanitiesAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/humanitiespercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),

    revokeHumanitiesOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/humanitiespercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),

    revokeHumanitiesDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/humanitiespercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),

    revokeHumanitiesAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/humanitiespercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['HumanitiesPercentile'],
    }),
  }),
});

export const {
  useGetHumanitiesTestCodesWithDistrictsQuery,
  useGetHumanitiesPercentileStatusQuery,
  useCalculateHumanitiesOverallPercentilesMutation,
  useCalculateHumanitiesDistrictPercentilesMutation,
  useCalculateHumanitiesAllDistrictsPercentilesMutation,
  useRevokeHumanitiesOverallPercentilesMutation,
  useRevokeHumanitiesDistrictPercentilesMutation,
  useRevokeHumanitiesAllDistrictsPercentilesMutation,
} = humanitiesPercentileApiSlice;
