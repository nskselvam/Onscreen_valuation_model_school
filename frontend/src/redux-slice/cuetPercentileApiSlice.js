import { apiSlice } from './apiSlice';

export const cuetPercentileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCuetTestCodesWithDistricts: builder.query({
      query: () => ({
        url: '/api/cuetpercentile/test-codes-with-districts',
        method: 'GET',
      }),
      providesTags: ['CuetPercentile'],
      keepUnusedDataFor: 300,
    }),

    getCuetPercentileStatus: builder.query({
      query: (testCode) => ({
        url: `/api/cuetpercentile/status/${testCode}`,
        method: 'GET',
      }),
      providesTags: (result, error, testCode) => [{ type: 'CuetPercentile', id: testCode }],
      keepUnusedDataFor: 300,
    }),

    calculateCuetOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/cuetpercentile/calculate-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),

    calculateCuetDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/cuetpercentile/calculate-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),

    calculateCuetAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/cuetpercentile/calculate-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),

    revokeCuetOverallPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/cuetpercentile/revoke-overall',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),

    revokeCuetDistrictPercentiles: builder.mutation({
      query: ({ testCode, districtCode }) => ({
        url: '/api/cuetpercentile/revoke-district',
        method: 'POST',
        body: { testCode, districtCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),

    revokeCuetAllDistrictsPercentiles: builder.mutation({
      query: ({ testCode }) => ({
        url: '/api/cuetpercentile/revoke-all-districts',
        method: 'POST',
        body: { testCode },
      }),
      invalidatesTags: ['CuetPercentile', 'CuetReport'],
    }),
  }),
});

export const {
  useGetCuetTestCodesWithDistrictsQuery,
  useGetCuetPercentileStatusQuery,
  useCalculateCuetOverallPercentilesMutation,
  useCalculateCuetDistrictPercentilesMutation,
  useCalculateCuetAllDistrictsPercentilesMutation,
  useRevokeCuetOverallPercentilesMutation,
  useRevokeCuetDistrictPercentilesMutation,
  useRevokeCuetAllDistrictsPercentilesMutation,
} = cuetPercentileApiSlice;
