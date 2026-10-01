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
    getModelSchoolUploadInventory: builder.query({
      query: (refreshToken = 0) => ({
        url: "/api/dashboard-operation/model-school-administrator/uploads",
        method: "GET",
        params: refreshToken ? { refresh: true } : undefined,
      }),
      keepUnusedDataFor: 300,
    }),
    getModelSchoolStudentMarks: builder.query({
      query: ({ testcode, district }) => ({
        url: "/api/dashboard-operation/model-school-administrator/student-marks",
        method: "GET",
        params: { testcode, district },
      }),
    }),
  }),
});

export const {
  useGetModelSchoolAdministratorDashboardQuery,
  useGetModelSchoolUploadInventoryQuery,
  useGetModelSchoolStudentMarksQuery,
} = modelSchoolAdministratorApiSlice;