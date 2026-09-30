import { QST_BANK_URL } from "../constraint/constraint";
import { apiSlice } from "./apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    qbankentry: builder.mutation({
      query: (data) => ({
        url: QST_BANK_URL,
        method: "POST",
        body: data,
      }),
      
    }),

    qbankeditse: builder.mutation({
      query:(data) =>({
        url:QST_BANK_URL,
        method: "POST",
        body:data,
      })
    }),
    
    qbankedit: builder.query({
      query: () => ({
        url: QST_BANK_URL,
        method: "GET",
      }),
      
    }),
    deleteQuestionSend: builder.mutation({
      query: (questionNumber) => ({
        url: `${QST_BANK_URL}/${questionNumber}`,
        method: "DELETE",
      }),
    }),

    qbankeditput: builder.mutation({
      query:(data) =>({
        url:`${QST_BANK_URL}/${data.id}`,
        method: "PUT",
        body:data,
      })
    }),
    
  }),
});

export const {useQbankentryMutation,useQbankeditseMutation,useQbankeditQuery,useDeleteQuestionSendMutation,useQbankeditputMutation} = authApiSlice;
