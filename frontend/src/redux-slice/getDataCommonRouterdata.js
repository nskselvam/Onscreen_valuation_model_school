import { apiSlice } from "./apiSlice";

export const getCommonDataFromTable = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCommonData: builder.query({
            query: (arg = 'sub_master') => {
                const tableId = typeof arg === 'object' ? arg.tableId : arg;
                const Dep_Name = typeof arg === 'object' ? arg.Dep_Name : undefined;
                const params = new URLSearchParams({ tableId });
                if (Dep_Name) params.append('Dep_Name', Dep_Name);
                return {
                    url: `api/get_data/common-data?${params.toString()}`,
                    method: 'GET',
                };
            },
            providesTags: (result, error, arg) => {
                const tableId = typeof arg === 'object' ? arg.tableId : arg;
                const Dep_Name = typeof arg === 'object' ? arg.Dep_Name : undefined;
                const id = Dep_Name ? `${tableId}_${Dep_Name}` : tableId;
                return [{ type: 'CommonData', id }];
            }
        }),
        getvalidQbsData: builder.mutation({
            query: (data) => ({
                url: `api/get_data/valid-qbs`,
                method: 'POST',
                body: data
            }),
            providesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_qbs_${arg.subcode}` }]
        }),
        getValidSectionsData: builder.mutation({
            query: (data) => ({
                url: `api/get_data/valid-sections`,
                method: 'POST',
                body: data
            }),
            providesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_sections_${arg.subcode}` }]
        }),

        getDataFromTheSubcode: builder.query({
            query: (subcode) => ({
                url: `api/common/master-valid-sections-cross-check`,
                method: 'GET',
            })
        }),

        // Subject CRUD mutations
        addSubject: builder.mutation({
            query: (data) => ({
                url: `api/get_data/subject`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: [{ type: 'CommonData', id: 'sub_master' }]
        }),

        updateSubject: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `api/get_data/subject/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: [{ type: 'CommonData', id: 'sub_master' }]
        }),

        deleteSubject: builder.mutation({
            query: (id) => ({
                url: `api/get_data/subject/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: [{ type: 'CommonData', id: 'sub_master' }]
        }),

        // Valid Questions CRUD mutations
        addValidQuestion: builder.mutation({
            query: (data) => ({
                url: `api/get_data/valid-question`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_qbs_${arg.SUBCODE}` }]
        }),

        updateValidQuestion: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `api/get_data/valid-question/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_qbs_${arg.SUBCODE}` }]
        }),

        deleteValidQuestion: builder.mutation({
            query: ({ id, subcode }) => ({
                url: `api/get_data/valid-question/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_qbs_${arg.subcode}` }]
        }),

        // Valid Sections CRUD mutations
        addValidSection: builder.mutation({
            query: (data) => ({
                url: `api/get_data/valid-section`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_sections_${arg.sub_code}` }]
        }),

        updateValidSection: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `api/get_data/valid-section/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_sections_${arg.sub_code}` }]
        }),

        deleteValidSection: builder.mutation({
            query: ({ id, subcode }) => ({
                url: `api/get_data/valid-section/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'CommonData', id: `valid_sections_${arg.subcode}` }]
        }),

    }),

});

export const { 
    useGetCommonDataQuery, 
    useGetvalidQbsDataMutation, 
    useGetValidSectionsDataMutation, 
    useGetDataFromTheSubcodeQuery,
    useLazyGetDataFromTheSubcodeQuery,
    useAddSubjectMutation,
    useUpdateSubjectMutation,
    useDeleteSubjectMutation,
    useAddValidQuestionMutation,
    useUpdateValidQuestionMutation,
    useDeleteValidQuestionMutation,
    useAddValidSectionMutation,
    useUpdateValidSectionMutation,
    useDeleteValidSectionMutation
} = getCommonDataFromTable;