import { apiSlice } from "./apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `/api/auth/login`,
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/api/auth/password_reset",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword_mail: builder.mutation({
      query: (data) => ({
        url: "/api/auth/email-sent",
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useResetPasswordMutation,
  useResetPassword_mailMutation,
} = authApiSlice;
