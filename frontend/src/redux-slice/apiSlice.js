import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {BASE_URL} from "../constraint/constraint"
import { logoutSuccess } from "./authSlice";

// Global flag to prevent multiple logout attempts
let isLoggingOut = false;

const baseQuery = fetchBaseQuery({
    baseUrl:BASE_URL,
    credentials:"include",
    timeout: 60000, // 60 second timeout
    prepareHeaders: (headers, { getState }) => {
        // Add current route path to headers
        const currentPath = window.location.pathname.substring(1); // Remove leading slash
        if (currentPath) {
            headers.set('x-current-route', currentPath);
        }
        
        // Note: JWT cookie is httpOnly, so it won't appear in document.cookie
        // The browser automatically includes it in requests when credentials:'include' is set
        console.log('🔐 Making API request with credentials:include (httpOnly cookies sent automatically)');
        
        return headers;
    },
});

// Enhanced base query with error logging and auth handling
const baseQueryWithLogging = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    
    if (result.error) {
        console.error('🚨 API Request Error:', {
            status: result.error.status,
            url: typeof args === 'string' ? args : args.url,
            message: result.error.data?.message
        });
        
        // Handle authentication/session errors
        const isAuthError = result.error.status === 401 || 
                           result.error.originalStatus === 401 ||
                           // Treat "No navigation permissions" as auth error (session/role issue)
                           (result.error.status === 403 && 
                            result.error.data?.message?.includes('No navigation permissions'));
        
        if (isAuthError && !isLoggingOut) {
            console.error('🔒 Authentication failed - Session expired or invalid');
            
            // Check if user info exists in state (meaning they were logged in)
            const state = api.getState();
            if (state.auth?.userInfo) {
                isLoggingOut = true; // Set flag immediately to prevent duplicates
                
                // Dispatch logout action to clear state
                api.dispatch(logoutSuccess());
                
                // Show toast notification once
                if (typeof window !== 'undefined') {
                    // Dynamically import toast to avoid circular dependencies
                    import('react-toastify').then(({ toast }) => {
                        toast.error('Your session has expired. Please login again.');
                    });
                    
                    // Redirect to login after a short delay
                    setTimeout(() => {
                        isLoggingOut = false; // Reset flag for next session
                        window.location.href = '/login';
                    }, 1000);
                }
            }
        }
    }
    
    return result;
};

export const apiSlice = createApi({
    baseQuery: baseQueryWithLogging,
    tagTypes: ["questionSend","Qresponse","Auth","UserData","CommonData", "CuetReport", "CuetPercentile", "NeetReport", "NeetPercentile", "Percentile", "CurrentAffairsPercentile", "GeneralAbilityPercentile", "QuantitativePercentile", "FoundationPercentile", "SpokenEnglishPercentile", "SpokenEnglishReport", "ClatPercentile", "ClatReport"],
    endpoints: (builder) => ({})
});