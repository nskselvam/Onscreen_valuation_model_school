import { apiSlice } from "./apiSlice";

export const masterApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMasterData: builder.query({
      query: () => ({
        url: `/api/master/get_district_master_data`,
        method: "GET",
      }),
      providesTags: ["MasterData"],
    }),
    getDashboardStatistics: builder.query({
      query: (districtCode) => ({
        url: `/api/master/dashboard_statistics`,
        method: "GET",
        params: { districtCode },
      }),
      providesTags: ["DashboardStats"],
    }),
    getStudentProcessingReport: builder.query({
      query: ({ districtCode, candidateStatus, schoolType }) => ({
        url: `/api/master/student_processing_report`,
        method: "GET",
        params: { districtCode, candidateStatus, schoolType },
      }),
      providesTags: ["StudentReport"],
    }),
  }),
});

export const { 
  useGetMasterDataQuery, 
  useGetDashboardStatisticsQuery,
  useGetStudentProcessingReportQuery 
} = masterApiSlice;
