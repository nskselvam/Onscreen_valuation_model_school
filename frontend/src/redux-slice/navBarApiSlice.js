import { apiSlice } from "./apiSlice";

export const NavBarApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNavbarMenu: builder.query({
      query: (data) => ({
        url: `/api/navbar/dataNav`,
        method: "GET",
        params: data,
      }),
      // Don't retry on auth failures (401)
      extraOptions: { maxRetries: 0 },
      // Don't refetch on mount/focus if there was an auth error
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }),
  }),
});

export const {
  useGetNavbarMenuQuery
} = NavBarApiSlice;
