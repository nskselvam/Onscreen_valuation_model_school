import {apiSlice} from "./apiSlice";

export const GeneralGetSqlOperationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRegulationData: builder.query({
      query: () => ({
        url: "/api/general/regulation-data",
        method: "GET",
      }),
    }),
    getCenterData: builder.query({
      query: () => ({
        url: "/api/general/center-data",
        method: "GET",
      }),
    }),
    // Returns all districts (DCODE, DNAME) ordered by DCODE
    getDistrictData: builder.query({
      query: () => ({
        url: "/api/general/district-data",
        method: "GET",
      }),
    }),
    // Returns districts whose DCODE is in the provided comma-separated string
    getDistrictsByCodes: builder.query({
      query: (codes) => ({
        url: `/api/general/district-data-by-codes?codes=${encodeURIComponent(codes)}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetRegulationDataQuery,
  useGetCenterDataQuery,
  useGetDistrictDataQuery,
  useGetDistrictsByCodesQuery,
} = GeneralGetSqlOperationApiSlice;
