
import {apiSlice} from './apiSlice'

export const generalApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getServerTime: builder.query({
            query: (data) => ({
                url: '/api/common/general-master-data',
                method: 'GET',
                data: data,
            }),
            keepUnusedDataFor: 300, // Cache for 5 minutes
            // Don't retry or refetch on auth failures
            extraOptions: { maxRetries: 0 },
            refetchOnMountOrArgChange: false,
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }),

        getTableDataWhere: builder.mutation({
            query: (data) => ({
                url: '/api/common/table_data_where',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CommonData'],
        }),
        uploadQuestionPaperKey: builder.mutation({
            query: (data) => ({
                url: '/api/common/upload_question_paper_key',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CommonData'],
        }),
        getFacultyData: builder.mutation({
            query: (data) => ({
                url: '/api/common/fetch_master_data',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CommonData'],
        }),
        addDepartment: builder.mutation({
            query: (data) => ({
                url: '/api/common/master-data-register',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['GeneralMasterData'],
        }),
        updateDepartment: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/api/common/master-data-register/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['GeneralMasterData'],
        }),
        deleteDepartment: builder.mutation({
            query: (id) => ({
                url: `/api/common/master-data/${id}`,
                method: 'DELETE',
                body: { tableName: 'master_data' },
            }),
            invalidatesTags: ['GeneralMasterData'],
        }),

        getMonthYearData: builder.query({
            query: () => ({
                url: '/api/month-year',
                method: 'GET',
            }),
            providesTags: ['MonthYearData'],
            keepUnusedDataFor: 300,
        }),
        addMonthYear: builder.mutation({
            query: (data) => ({
                url: '/api/month-year',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['MonthYearData'],
        }),
        updateMonthYear: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/api/month-year/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['MonthYearData'],
        }),
        deleteMonthYear: builder.mutation({
            query: (id) => ({
                url: `/api/month-year/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['MonthYearData'],
        }),

        getUserAttendanceLogs: builder.query({
            query: ({ startDate, endDate, userName }) => {
                let queryString = '';
                if (startDate) queryString += `startDate=${startDate}`;
                if (endDate) queryString += `&endDate=${endDate}`;
                if (userName) queryString += `&userName=${userName}`;
                
                return {
                    url: `/api/common/user-attendance-logs?${queryString}`,
                    method: 'GET',
                };
            },
            providesTags: ['UserAttendance'],
            keepUnusedDataFor: 60,
        }),

        getUserAttendanceSummary: builder.query({
            query: ({ startDate, endDate }) => ({
                url: `/api/common/user-attendance-summary?startDate=${startDate}&endDate=${endDate}`,
                method: 'GET',
            }),
            providesTags: ['UserAttendance'],
            keepUnusedDataFor: 60,
        }),

    })
});

export const { 
    useGetServerTimeQuery, 
    useGetTableDataWhereMutation, 
    useUploadQuestionPaperKeyMutation, 
    useGetFacultyDataMutation, 
    useAddDepartmentMutation, 
    useUpdateDepartmentMutation, 
    useDeleteDepartmentMutation, 
    useGetMonthYearDataQuery, 
    useAddMonthYearMutation, 
    useUpdateMonthYearMutation, 
    useDeleteMonthYearMutation,
    useGetUserAttendanceLogsQuery,
    useGetUserAttendanceSummaryQuery
} = generalApiSlice;