import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux-slice/authSlice";
import errDataInfoReducer from "../redux-slice/errResponseSlice";
import valuationReducer from "../redux-slice/valuationSlice";
import { apiSlice } from "../redux-slice/apiSlice";
import markInpInfoReducer from '../redux-slice/markApiSlice';
import examinerValuationReducer from '../redux-slice/examinerValuationSlice';
import valuationreviewReducer from '../redux-slice/reviewSlice';
import navbarReducer from '../redux-slice/navbarSlice';
import masterDataAdminReducer from "../redux-slice/getDataCommonRouterSlice";

const { VITE_NODE_ENV } = import.meta.env;

const store = configureStore({
  reducer: {
    auth: authReducer,
    errinfo: errDataInfoReducer,
    valuaton_Data_basic: valuationReducer,
    mark_giver_info: markInpInfoReducer,
    examiner_valuation: examinerValuationReducer,
    valuationreview: valuationreviewReducer,
    navbarBar: navbarReducer,
    masterDataAdminData: masterDataAdminReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore RTK Query actions that may contain non-serializable data (blobs, promises, etc)
        ignoredActions: [
          'api/executeQuery/fulfilled', 
          'api/executeQuery/pending',
          'api/executeQuery/rejected',
          // Ignore all RTK Query internal actions
          /^api\/.*\/(pending|fulfilled|rejected)$/,
        ],
        // Ignore the entire api.queries state path which may contain cached blobs and meta info
        ignoredPaths: ['api.queries', 'api.mutations', 'api.subscriptions', 'api.config'],
      },
    }).concat(apiSlice.middleware),
  // Enable Redux DevTools only in development
  devTools: VITE_NODE_ENV !== "production",
});

export default store;
