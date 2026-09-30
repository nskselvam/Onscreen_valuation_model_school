/**
 * Application Constants - Google/Facebook Style
 * Centralized configuration and constants
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 300000, // 5 minutes
  STATIC_CACHE_TTL: 1800000 // 30 minutes
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'userPreferences',
  CACHE_VERSION: 'cacheVersion'
};

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/common/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  RESET_PASSWORD: '/reset-password',
  VALUATION: '/valuation',
  CHIEF_VALUATION: '/valuation/chief-valuation',
  EXAMINER_VALUATION: '/examiner/valuation-review',
  NOT_FOUND: '*'
};

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  EXAMINER: 'examiner',
  CHIEF_EXAMINER: 'chief_examiner',
  REVIEWER: 'reviewer',
  SUPER_ADMIN: 'super_admin'
};

/**
 * Permissions
 */
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view:dashboard',
  EDIT_VALUATION: 'edit:valuation',
  APPROVE_VALUATION: 'approve:valuation',
  MANAGE_USERS: 'manage:users',
  EXPORT_DATA: 'export:data',
  UPLOAD_FILES: 'upload:files'
};

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 500,
  PAGE_SIZE: 20,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 50,
  VIRTUAL_SCROLL_OVERSCAN: 3,
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 300
};

/**
 * Performance Thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME: 16, // 60fps target
  API_RESPONSE: 500, // 500ms
  SEARCH_DEBOUNCE: 300, // 300ms
  MAX_RENDERS_WARNING: 20
};

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  LRU_SIZE: 100,
  SELECTOR_CACHE_SIZE: 50,
  API_CACHE_SIZE: 100,
  COMPONENT_CACHE_SIZE: 30
};

/**
 * Form Validation Rules
 */
export const VALIDATION_RULES = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\d{10}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT: 'Request timeout. Please try again.'
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  SAVE_SUCCESS: 'Data saved successfully!',
  UPDATE_SUCCESS: 'Data updated successfully!',
  DELETE_SUCCESS: 'Data deleted successfully!',
  UPLOAD_SUCCESS: 'File uploaded successfully!'
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_VIRTUAL_SCROLL: true,
  ENABLE_CACHE: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: import.meta.env.DEV,
  ENABLE_PERFORMANCE_MONITORING: true
};

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'DD-MM-YYYY',
  DISPLAY_WITH_TIME: 'DD-MM-YYYY HH:mm:ss',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
  TIME_ONLY: 'HH:mm:ss'
};

/**
 * Table Configuration
 */
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_ROWS_WITHOUT_VIRTUALIZATION: 100,
  SORT_DIRECTIONS: {
    ASC: 'asc',
    DESC: 'desc',
    NONE: null
  }
};

/**
 * Action Types Patterns
 */
export const ACTION_TYPES = {
  // Request lifecycle
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RESET: 'RESET',

  // CRUD operations
  FETCH: 'FETCH',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',

  // State management
  SET: 'SET',
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
  TOGGLE: 'TOGGLE'
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Environment Variables Helper
 */
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME || 'Onscreen Valuation',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0'
};

/**
 * Keyboard Keys
 */
export const KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight'
};

/**
 * Color Palette (can be used for charts, status indicators)
 */
export const COLORS = {
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40'
};

/**
 * Z-Index Layers
 */
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080
};

export default {
  API_CONFIG,
  STORAGE_KEYS,
  ROUTES,
  USER_ROLES,
  PERMISSIONS,
  UI_CONSTANTS,
  PERFORMANCE_THRESHOLDS,
  CACHE_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURE_FLAGS,
  DATE_FORMATS,
  TABLE_CONFIG,
  ACTION_TYPES,
  HTTP_STATUS,
  ENV,
  KEYS,
  COLORS,
  Z_INDEX
};
