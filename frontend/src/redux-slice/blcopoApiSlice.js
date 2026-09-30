import { BASE_URL } from "../constraint/constraint";
import { apiSlice } from "./apiSlice";

export const blcopoApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoPoData: builder.query({
      query: (data) => ({
        url: `/api/v1/blcopo/getSubcode`,
        method: "GET",
        params: data,
      }),
    }),

      blCoPoData : builder.mutation({
        query: (data) => ({
          url: `/api/v1/blcopo/get-blcopo-data`,
          method: "POST",
          body: data,
          timeout: 1200000, // 20 minutes timeout
          responseHandler: async (response) => {
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'download.zip';
            if (contentDisposition) {
              const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
              if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
              }
            }
            return { blob, filename };
          },
        }),
      }),



  }),
});

export const { useGetCoPoDataQuery, useBlCoPoDataMutation } = blcopoApiSlice;