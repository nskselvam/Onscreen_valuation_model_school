import { apiSlice } from './apiSlice'

export const thiyagarayaReviewImageApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getThiyagarayaReviewImage: builder.query({
      query: (params) => ({
        url: '/api/thiyagaraya-review-image',
        method: 'GET',
        params,
      }),
    }),
  }),
})

export const {
  useGetThiyagarayaReviewImageQuery,
} = thiyagarayaReviewImageApiSlice