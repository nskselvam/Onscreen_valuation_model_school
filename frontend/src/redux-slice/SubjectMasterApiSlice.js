import { apiSlice } from "./apiSlice";
export const valuationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSubjectData: builder.query({
            query: () => ({
                url: `/api/subject`,
                method: "GET",
             
            }),
        }),
        SubjectQuestionPaper : builder.mutation({
            query: (data) => ({
                url: `/api/subject/question_paper`,
                method: "POST",
                body: data,
                responseHandler: async (response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    // Return the response as a blob for PDF
                    return response.blob();
                },
                cache: 'no-cache',
            }),
        }),
    }),
});
export const { useGetSubjectDataQuery, useSubjectQuestionPaperMutation } = valuationApiSlice;