import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../redux-slice/authSlice';
import { apiSlice } from '../redux-slice/apiSlice';
import {useLogoutMutation} from '../redux-slice/authApiSlice';

/**
 * Custom hook for logging out and clearing all application state
 * 
 * This hook will:
 * 1. Dispatch the logoutSuccess action which triggers all slices to reset via extraReducers
 * 2. Clear RTK Query cache
 * 3. Clear all localStorage data
 * 4. Reset all Redux state to initial values
 * 
 * Usage:
 * ```
 * const logout = useLogout();
 * 
 * const handleLogout = () => {
 *   logout();
 * };
 * ```
 */

export const useLogout = () => {
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();

  const logout = async () => {
    try {
      // Call the logout API
      await logoutApi().unwrap();
    } catch (error) {
      // Continue with logout even if API fails
      console.error('Logout API error:', error);
    }

    // Dispatch logout action - this will trigger extraReducers in all slices
    dispatch(logoutSuccess());
    
    // Clear RTK Query cache
    dispatch(apiSlice.util.resetApiState());
    
    // Clear any remaining localStorage items
    const itemsToRemove = [
      'userInfo',
      'master_data_admin',
      'errInfo',
      'valuationData',
      'currentSubCode',
      'dashboardData',
      'chiefValuationData',
      'chiefValuationBarcodeData',
      'markInpInfo',
      'examinerValuation',
      'examinerValuationres',
      'valuationreview',
      'navbar',
      'token'
    ];
    
    itemsToRemove.forEach(item => {
      if (localStorage.getItem(item)) {
        localStorage.removeItem(item);
      }
    });
    
    // Optional: Clear all localStorage if needed
    // localStorage.clear();
  };

  return logout;
};

export default useLogout;
