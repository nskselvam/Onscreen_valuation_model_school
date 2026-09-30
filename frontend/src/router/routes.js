// Route definitions for reference and validation
// This file helps ensure all menu items have corresponding routes

export const ROUTE_DEFINITIONS = {
  // Authentication & User Management
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  PROFILE: '/profile',
  
  // Dashboards
  COMMON_DASHBOARD: '/common/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  
  // Uploads
  EXCEL_TEXT_UPLOAD: '/excel-text-upload',
  
  // Evaluation
  EXAMINER_VALUATION_REVIEW: '/examiner/valuation-review',
  VALUATION: '/valuation',
  CHIEF_VALUATION: '/valuation/chief-valuation',
  CHIEF_VALUATION_REVIEW: '/valuation/chief-valuation-review',
  CHIEF_VALUATION_REVIEW_MAIN: '/valuation/chief-valuation-review-main',
  CHIEF_REVIEW: '/valuation/chief-review',
  
  // Utilities
  ADMIN_WINDOW: '/admin/admin-window',
  SCANNING_VALUATION_DATA: '/admin/scanning-valuation-data',
  
  // Master Data
  USER_MASTER: '/admin/userMaster',
  SUBJECT_MASTER: '/admin/subject_master_dashboard',
  VALID_QBS_MASTER: '/admin/valid_qbs_master',
  VALID_SELECTION: '/admin/valid_selection',
  QP_AND_ANSWER_KEY: '/admin/qp_and_answerkey',
  QP_AND_ANSWER_KEY_UPLOAD: '/admin/qp_and_answerkey_upload',
  DEGREE_MASTER: '/admin/degree-master',
  MONTH_YEAR: '/admin/month-year',
  FACULTY_CHECKING: '/admin/faculty-checking',
  
  // Valuation Status
  CAMP_DETAILS: '/admin/camp_details',
  SUBCODE_DETAILS: '/admin/subcode_details',
  EXAMINER_SUBCODE_DETAILS: '/admin/examiner_subcode_details',
  CHIEF_SUBCODE_DETAILS: '/admin/chief_subcode_details',
  PAPER_LOCKED_PENDING: '/admin/paper_locked_pending',
  REMARKS_MALPRACTICE: '/admin/remarks_malpractice',
  SUBCODE_EVALUATION_STATUS_EXAMINER: '/admin/subcode_evaluation_status_examiner',
  EXAMINER_ATTENDANCE: '/admin/examiner-attendance',
  
  // Examiner
  EXAMINER_REVIEW: '/examiner/review',
  EXAMINER_REVIEW_VALUATION: '/examiner/reviewe/valuationreview',
  EXAMINER_RESET_PASSWORD: '/examiner/resetpassword',
  EXAMINER_USER_PASSWORD: '/examiner/userpassword',
  EXAMINER_PAYMENT_REPORT: '/Evaluator/examiner-payment-report',
  EVALUATOR_PRINT_PDF: '/Evaluator/PrintPdf',
  EVALUATOR_PAYMENT: '/Evaluator/Payment',
  
  // Alteration
  EXAMINER_ALTERATION: '/examiner_alteration',
  CHIEF_EXAMINER_ALTERATION: '/chief_examiner_alteration',
  
  // Paper Review
  PAPER_REVIEW_DATA: '/paper-review-data',
  PAPER_REVIEW_ZERO: '/paper-review-zero',
  
  // Valuation Paper Checking
  // (Add specific route if exists)
  
  // Export Data
  DATA_EXPORT: '/admin/export-data',
  
  // Valuation Move
  VALUATION_MOVE: '/admin/valuation-move',
  VALUATION_CANCEL: '/admin/valuation-cancel',
  
  // Data Backup
  DATA_BACKUP: '/admin/data-backup',
  
  // MCQ Operation
  MCQ_MASTER_UPDATE: '/master/mcqmaster-update',
  MCQ_MASTER_EXPORT: '/master/mcqmaster-export',
  
  // Navbar/Roll Management
  ADMIN_ROLL_UPDATE: '/admin/admin-rollupdate',
  NAVBAR_ADD: '/admin/navbaradd',
  ROLL_MASTER: '/admin/rollmaster',
  EXAMINER_ROLL_UPDATE: '/admin/examinerrollupdate',
  
  // Chief Remarks
  CHIEF_REMARKS: '/chiefRemarks',
  
  // User Roll
  USER_ROLL_MASTER: '/admin/admin-rollupdate',
}

// Group routes by menu category for easier reference
export const ROUTE_GROUPS = {
  uploads: [
    ROUTE_DEFINITIONS.EXCEL_TEXT_UPLOAD,
  ],
  
  evaluation: [
    ROUTE_DEFINITIONS.EXAMINER_VALUATION_REVIEW,
    ROUTE_DEFINITIONS.VALUATION,
    ROUTE_DEFINITIONS.CHIEF_VALUATION,
    ROUTE_DEFINITIONS.CHIEF_VALUATION_REVIEW,
    ROUTE_DEFINITIONS.CHIEF_VALUATION_REVIEW_MAIN,
    ROUTE_DEFINITIONS.CHIEF_REVIEW,
  ],
  
  utilities: [
    ROUTE_DEFINITIONS.ADMIN_WINDOW,
    ROUTE_DEFINITIONS.SCANNING_VALUATION_DATA,
  ],
  
  masterData: [
    ROUTE_DEFINITIONS.USER_MASTER,
    ROUTE_DEFINITIONS.SUBJECT_MASTER,
    ROUTE_DEFINITIONS.VALID_QBS_MASTER,
    ROUTE_DEFINITIONS.VALID_SELECTION,
    ROUTE_DEFINITIONS.QP_AND_ANSWER_KEY,
    ROUTE_DEFINITIONS.QP_AND_ANSWER_KEY_UPLOAD,
    ROUTE_DEFINITIONS.DEGREE_MASTER,
    ROUTE_DEFINITIONS.MONTH_YEAR,
    ROUTE_DEFINITIONS.FACULTY_CHECKING,
  ],
  
  valuationStatus: [
    ROUTE_DEFINITIONS.CAMP_DETAILS,
    ROUTE_DEFINITIONS.SUBCODE_DETAILS,
    ROUTE_DEFINITIONS.EXAMINER_SUBCODE_DETAILS,
    ROUTE_DEFINITIONS.CHIEF_SUBCODE_DETAILS,
    ROUTE_DEFINITIONS.PAPER_LOCKED_PENDING,
    ROUTE_DEFINITIONS.REMARKS_MALPRACTICE,
    ROUTE_DEFINITIONS.SUBCODE_EVALUATION_STATUS_EXAMINER,
    ROUTE_DEFINITIONS.EXAMINER_ATTENDANCE,
  ],
  
  examiner: [
    ROUTE_DEFINITIONS.EXAMINER_REVIEW,
    ROUTE_DEFINITIONS.EXAMINER_REVIEW_VALUATION,
    ROUTE_DEFINITIONS.EXAMINER_RESET_PASSWORD,
    ROUTE_DEFINITIONS.EXAMINER_USER_PASSWORD,
    ROUTE_DEFINITIONS.EXAMINER_PAYMENT_REPORT,
    ROUTE_DEFINITIONS.EVALUATOR_PRINT_PDF,
    ROUTE_DEFINITIONS.EVALUATOR_PAYMENT,
  ],
  
  alteration: [
    ROUTE_DEFINITIONS.EXAMINER_ALTERATION,
    ROUTE_DEFINITIONS.CHIEF_EXAMINER_ALTERATION,
  ],
  
  paperReview: [
    ROUTE_DEFINITIONS.PAPER_REVIEW_DATA,
    ROUTE_DEFINITIONS.PAPER_REVIEW_ZERO,
  ],
  
  exportData: [
    ROUTE_DEFINITIONS.DATA_EXPORT,
  ],
  
  valuationMove: [
    ROUTE_DEFINITIONS.VALUATION_MOVE,
    ROUTE_DEFINITIONS.VALUATION_CANCEL,
  ],
  
  dataBackup: [
    ROUTE_DEFINITIONS.DATA_BACKUP,
  ],
  
  mcqOperation: [
    ROUTE_DEFINITIONS.MCQ_MASTER_UPDATE,
    ROUTE_DEFINITIONS.MCQ_MASTER_EXPORT,
  ],
  
  navbarRoll: [
    ROUTE_DEFINITIONS.ADMIN_ROLL_UPDATE,
    ROUTE_DEFINITIONS.NAVBAR_ADD,
    ROUTE_DEFINITIONS.ROLL_MASTER,
    ROUTE_DEFINITIONS.EXAMINER_ROLL_UPDATE,
  ],
}

// Helper function to check if a route exists
export const isValidRoute = (path) => {
  return Object.values(ROUTE_DEFINITIONS).includes(path)
}

// Helper function to get route category
export const getRouteCategory = (path) => {
  for (const [category, routes] of Object.entries(ROUTE_GROUPS)) {
    if (routes.includes(path)) {
      return category
    }
  }
  return null
}

export default ROUTE_DEFINITIONS
