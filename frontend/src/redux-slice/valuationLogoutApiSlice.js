import { apiSlice } from "./apiSlice";
export const valuationStatusApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

 submitBarcodeValuation: builder.mutation({
      query: (data) => ({
        url: `api/valuationstatus/barcode-reversal`,
        method: "PUT",
        body: data
      }),
      invalidatesTags: ['BarcodeValuationStatus']
    }),
    })
});
export const { useSubmitBarcodeValuationMutation } = valuationStatusApiSlice;
