# useLogout Hook Documentation

## Overview
The `useLogout` hook provides a centralized way to log out users and clear all application state across all Redux slices.

## What it does
When called, the hook will:
1. ✅ Clear all Redux state in all slices (auth, errinfo, valuation, marks, examiner, review, navbar)
2. ✅ Remove all localStorage data
3. ✅ Clear RTK Query cache
4. ✅ Reset everything to initial state

## Usage

### Basic Usage
```javascript
import useLogout from '../hooks/useLogout';

function MyComponent() {
  const logout = useLogout();

  const handleLogout = () => {
    logout();
    // Optional: Navigate to login page
    // navigate('/login');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

### With React Router Navigation
```javascript
import { useNavigate } from 'react-router-dom';
import useLogout from '../hooks/useLogout';

function Header() {
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

### With Confirmation Dialog
```javascript
import useLogout from '../hooks/useLogout';

function UserMenu() {
  const logout = useLogout();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

## What Gets Cleared

### Redux State
- ✅ `auth` - User info, active role, items
- ✅ `errinfo` - Error information
- ✅ `valuaton_Data_basic` - Valuation data, dashboard data, chief valuation data
- ✅ `mark_giver_info` - All mark input information
- ✅ `examiner_valuation` - Examiner data
- ✅ `valuationreview` - Review data
- ✅ `navbarBar` - Navbar data
- ✅ `api` - RTK Query cache

### localStorage
- ✅ `userInfo`
- ✅ `errInfo`
- ✅ `valuationData`
- ✅ `currentSubCode`
- ✅ `dashboardData`
- ✅ `chiefValuationData`
- ✅ `chiefValuationBarcodeData`
- ✅ `markInpInfo`
- ✅ `examinerValuation`
- ✅ `valuationreview`
- ✅ `navbar`
- ✅ `token`

## Implementation Details

The hook uses Redux's `extraReducers` pattern. Each slice listens to the `logoutSuccess` action from authSlice and automatically resets its state when logout occurs.

```javascript
// In each slice
extraReducers: (builder) => {
  builder.addCase(logoutSuccess, (state) => {
    // Reset state to initial values
  });
}
```

This ensures all slices are properly reset without needing to manually dispatch multiple actions.
