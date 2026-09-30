import { apiSlice } from "./apiSlice";

export const adminSqlApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTables: builder.query({
      query: () => ({
        url: `/api/admin-sql/tables`,
        method: "GET",
      }),
    }),
    executeQuery: builder.mutation({
      query: (data) => ({
        url: "/api/admin-sql/execute-query",
        method: "POST",
        body: data,
      }),
    }),
    getTableStructure: builder.query({
      query: (tableName) => ({
        url: `/api/admin-sql/table/${tableName}/structure`,
        method: "GET",
      }),
    }),
    getTableData: builder.query({
      query: ({ tableName, limit = 100, offset = 0 }) => ({
        url: `/api/admin-sql/table/${tableName}/data`,
        method: "GET",
        params: { limit, offset },
      }),
    }),
  }),
});

export const {
  useGetTablesQuery,
  useExecuteQueryMutation,
  useGetTableStructureQuery,
  useGetTableDataQuery,
  useLazyGetTablesQuery,
  useLazyGetTableStructureQuery,
  useLazyGetTableDataQuery,
} = adminSqlApiSlice;
