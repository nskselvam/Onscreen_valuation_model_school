import { apiSlice } from "./apiSlice";

export const vacancyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDistrictMasterData: builder.query({
      query: () => ({
        url: `/api/vacancy/get_district_master_data`,
        method: "GET",
      }),
      providesTags: ["DistrictMasterData"],
    }),

    getVacancyData: builder.query({
      query: (dcode = 'ALL') => ({
        url: `/api/vacancy/get_vacancy_data/${dcode}`,
        method: "GET",
      }),
      providesTags: ["VacancyData"],
    }),
    districtSendData: builder.mutation({
      query: (data) => ({
        url: `/api/master/district_send_data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["VacancyData", "DistrictSelectedData"],
    }),

    getDistrictSelectedData: builder.query({
      query: (data) => ({
        url: `/api/master/get_district_selected_data`,
        method: "GET",
        params: data,
      }),
      providesTags: ["DistrictSelectedData"],
    }),

    updateDistrictData: builder.mutation({
      query: (data) => ({
        url: `/api/master/update_district_data`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DistrictSelectedData"],
    }),
    updateCertificateVerfiedStatus: builder.mutation({
      query: (data) => ({
        url: `/api/master/update_certificate_verified_status`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DistrictSelectedData"],
    }),
  }),
});


export const { 
  useGetVacancyDataQuery,
  useGetDistrictMasterDataQuery,
  useDistrictSendDataMutation,
  useGetDistrictSelectedDataQuery,
  useUpdateDistrictDataMutation,
  useUpdateCertificateVerfiedStatusMutation
} = vacancyApiSlice;