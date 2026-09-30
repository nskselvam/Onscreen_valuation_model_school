import { apiSlice } from './apiSlice'

export const auditingOperationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSubjectCode: builder.query({
            query: (userId) => ({
                url: `/api/auditing-operation/auditing-subjectcode/getSubcode/${userId}`,
                method: 'GET',
            }),
        }),
    }),
})

export const { useGetSubjectCodeQuery } = auditingOperationApiSlice