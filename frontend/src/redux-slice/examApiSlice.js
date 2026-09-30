import { QST_MASTER_URL } from "../constraint/constraint";
import { apiSlice } from "./apiSlice";


export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        examentry: builder.mutation({

            query: (data) => ({
                url: `${QST_MASTER_URL}/CandidateUpload`,
                method: "POST",
                body: data,
            })
        })
    })
})

export const { useExamentryMutation } = authApiSlice;