import { apiSlice } from "./apiSlice";

export const excelApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        exceltext: builder.mutation({
            query: (data) => ({
                url: `/api/excel-text`,
                method: "POST",
                body: data,
            }),
        }),
        imagecheck: builder.mutation({
            query: () => ({
                url: `/api/excel-text/image-check`,
                method: "GET",
            }),
        }),
        getSubjectCode: builder.query({
            query: (data) => ({
                url: `/api/excel-text/subject-code`,
                method: "GET",
                params: data,
            }),
        }),
        getTableCount: builder.query({
            query: () => ({
                url: `/api/excel-text/table-count`,
                method: "GET",
            }),
        }),
    }),
});

export const { useExceltextMutation, useImagecheckMutation, useGetSubjectCodeQuery, useGetTableCountQuery } = excelApiSlice;
