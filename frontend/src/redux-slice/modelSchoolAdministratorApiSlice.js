import { apiSlice } from "./apiSlice";

export const modelSchoolAdministratorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getModelSchoolAdministratorDashboard: builder.query({
      query: () => ({
        url: "/api/dashboard-operation/model-school-administrator",
        method: "GET",
      }),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useGetModelSchoolAdministratorDashboardQuery } = modelSchoolAdministratorApiSlice;