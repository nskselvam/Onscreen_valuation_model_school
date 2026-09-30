import { apiSlice } from "./apiSlice";

export const McqOperationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        mcqMasterDataUpdate: builder.mutation({
            query: (data) => ({
                url: `/api/mcq-operation/mcq_master_data_update`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['McqAnswers', 'SubMaster'],
        }),
        mcqMasterDataBySubcode: builder.query({
            query: () => ({
                url: `/api/mcq-operation/get_mcq_data_by_subcode`,
                method: "GET",
            }),
            providesTags: ['McqMaster'],
        }),
        mcqDataUpdate: builder.mutation({
            query: (data) => ({
                url: `/api/mcq-operation/mcq_data_update`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['McqAnswers'],
        }),
        getMcqDataBySubcodeFromTheBack: builder.query({
            query: ({ Eva_Id, Subcode }) => {
                const params = { Eva_Id };
                if (Subcode) {
                    params.subcode = Subcode;
                }
                return {
                    url: `/api/mcq-operation/get_mcq_data_by_subcode_from_back`,
                    method: "GET",
                    params
                };
            },
            providesTags: ['McqAnswers'],
        }),
        updateMcqDataFinal: builder.mutation({
            query: (data) => ({
                url: `/api/mcq-operation/update_mcq_data_final`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['McqAnswers', 'SubMaster'],
        }),
        reverteMcqDataFinal: builder.mutation({
            query: (data) => ({
                url: `/api/mcq-operation/revert_mcq_data_final`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['McqAnswers', 'SubMaster'],
        }),
        evaluatorDataFromTheBack: builder.query({
            query: () => ({
                url: `/api/mcq-operation/evaluator_data`,
                method: "GET",
            }),
            providesTags: ['EvaluatorData'],

        }),
        getMcqPdf: builder.query({
            query: ({ eva_month_year, department, registerno, subcode }) => ({
                url: `/api/mcq-pdf/mcq-paper`,
                method: "GET",
                params: { eva_month_year, department, registerno, subcode },
                responseHandler: (response) => {
                    if (!response.ok) {
                        return response.json();
                    }
                    return response.blob();
                },
                cache: 'no-cache',
            }),
        }),


    }),
});

export const {
    useMcqMasterDataUpdateMutation,
    useMcqMasterDataBySubcodeQuery,
    useMcqDataUpdateMutation,
    useGetMcqDataBySubcodeFromTheBackQuery,
    useLazyGetMcqDataBySubcodeFromTheBackQuery,
    useUpdateMcqDataFinalMutation,
    useReverteMcqDataFinalMutation,
    useEvaluatorDataFromTheBackQuery,
    useLazyGetMcqPdfQuery,

} = McqOperationApiSlice;