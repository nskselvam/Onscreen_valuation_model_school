import { apiSlice } from "./apiSlice";
export const adminOperationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUserData: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => ({
        url: `/api/admin/all_user_data`,
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ['UserData'],
    }),
    addNewUser: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_user_data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    deleteAdminUser: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_user_data`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    addupdateSubjectData: builder.mutation({
      query: (data) => ({
        url: `/api/admin/add_update_subject_data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    deleteSubjectData: builder.mutation({
      query: (data) => ({
        url: `/api/admin/add_update_subject_data`,
        method: "POST",
        body: { ...data, mode: 'delete' },
      }),
      invalidatesTags: ['UserData'],
    }),
    updateGeneralBioData: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_general_bio_data`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    getAllUserDataError: builder.query({
      query: () => ({
        url: `/api/admin/all_user_data_error`,
        method: "GET",
      }),
      providesTags: ['UserData'],
    }),
    getAllUserDatacrosscheck: builder.query({
      query: () => ({
        url: `/api/examiner/examiner_check`,
        method: "GET",
      }),
      providesTags: ['UserData'],
    }),
    updateFacultyRawFields: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_faculty_raw_fields`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserData'],
    }),
    getNavbarDetails: builder.query({
      query: () => ({
        url: `/api/admin/get_all_user_roll_data`,
        method: "POST",
        body: {},
      }),
      providesTags: ['UserDataNavbar'],
    }),
    createNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    updateNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    deleteNavbarItem: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_navbar_item`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['UserDataNavbar'],
    }),
    getAllRollMasters: builder.query({
      query: () => ({
        url: `/api/admin/get_all_roll_masters`,
        method: "POST",
        body: {},
      }),
      providesTags: ['RollMaster'],
    }),
    createRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/create_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),
    updateRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/update_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),
    deleteRollMaster: builder.mutation({
      query: (data) => ({
        url: `/api/admin/delete_roll_master`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['RollMaster'],
    }),

      updateRollMasterMapping: builder.mutation({
      query: (data) => {
        // If data contains ExaminerRoll, use batch update endpoint
        // Otherwise use single user update endpoint
        const url = data.ExaminerRoll 
          ? `/api/admin/updateRollMaster`
          : `/api/admin/update_user_roll_admin`;
        
        return {
          url,
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ['RollMaster'],
    }),
  }),
});

//updateRollMaster
export const { 
  useGetAllUserDataQuery, 
  useAddNewUserMutation, 
  useDeleteAdminUserMutation, 
  useAddupdateSubjectDataMutation, 
  useDeleteSubjectDataMutation, 
  useUpdateGeneralBioDataMutation, 
  useGetAllUserDataErrorQuery, 
  useGetAllUserDatacrosscheckQuery, 
  useUpdateFacultyRawFieldsMutation, 
  useGetNavbarDetailsQuery,
  useCreateNavbarItemMutation,
  useUpdateNavbarItemMutation,
  useDeleteNavbarItemMutation,
  useGetAllRollMastersQuery,
  useCreateRollMasterMutation,
  useUpdateRollMasterMutation,
  useDeleteRollMasterMutation,
  useUpdateRollMasterMappingMutation
} = adminOperationApiSlice;