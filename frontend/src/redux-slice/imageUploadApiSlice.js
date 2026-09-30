import { apiSlice } from "./apiSlice";

export const imageUploadApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTestMastersForImageUpload: builder.query({
      query: (districtCode) => ({
        url: `/api/testmaster/for-image-upload${districtCode ? `?districtCode=${districtCode}` : ''}`,
        method: "GET",
      }),
      providesTags: ["ImageUpload"],
    }),
    uploadTestImages: builder.mutation({
      query: (formData) => ({
        url: "/api/imageupload/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ImageUpload", "TestMaster"],
    }),
    getTestImages: builder.query({
      query: ({ testcode, districtCode }) => ({
        url: `/api/imageupload/${testcode}${districtCode ? `?districtCode=${districtCode}` : ''}`,
        method: "GET",
      }),
      providesTags: ["ImageUpload"],
    }),
    getImageCountsByDistrict: builder.query({
      query: (testcode) => ({
        url: `/api/imageupload/counts/${testcode}`,
        method: "GET",
      }),
      providesTags: ["ImageUpload"],
    }),
    deleteTestImage: builder.mutation({
      query: (id) => ({
        url: `/api/imageupload/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ImageUpload"],
    }),
    deleteAllTestImages: builder.mutation({
      query: (data) => ({
        url: "/api/imageupload/delete-all",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ImageUpload", "TestMaster"],
    }),
    confirmImageUpload: builder.mutation({
      query: (data) => ({
        url: "/api/imageupload/confirm",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ImageUpload", "TestMaster"],
    }),
  }),
});

export const {
  useGetTestMastersForImageUploadQuery,
  useUploadTestImagesMutation,
  useGetTestImagesQuery,
  useGetImageCountsByDistrictQuery,
  useDeleteTestImageMutation,
  useDeleteAllTestImagesMutation,
  useConfirmImageUploadMutation,
} = imageUploadApiSlice;
