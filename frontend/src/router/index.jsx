import React, { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Renderpage from "../render/Renderpage.jsx";
import Protected from "../private/Protected.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const Login = lazy(() => import("../pages/Login/Login.jsx"));
const ResetPassword = lazy(() => import("../pages/reset_password/ResetPassword.jsx"));
const Profile = lazy(() => import("../pages/Profile/Profile.jsx"));
const CommonDashboar = lazy(() => import("../pages/Dashboard/Common/CommonDashboar.jsx"));
const District_Common_Dashboard = lazy(() => import("../pages/Dashboard/Common/District_Common_Dashboard.jsx"));
const Zone_common_Dashboard = lazy(() => import("../pages/Dashboard/Common/Zone_common_Dashboard.jsx"));
const HeadMaster_Common_Dashboard = lazy(() => import("../pages/Dashboard/Common/HeadMaster_Common_Dashboard.jsx"));
const DistrictOfficials_Common_Dashboard = lazy(() => import("../pages/Dashboard/Common/DistrictOfficials_Common_Dashboard.jsx"));
const StateCoordinator_Common_Dashboard = lazy(() => import("../pages/Dashboard/Common/StateCoordinator_Common_Dashboard.jsx"));
const StateAssistant_Common_Dashboard = lazy(() => import("../pages/Dashboard/Common/StateAssistant_Common_Dashboard.jsx"));
const District_Dashboard = lazy(() => import("../pages/Dashboard/District_Dashboard/District_Dashboard.jsx"));
const State_Dashboard = lazy(() => import("../pages/Dashboard/State_Dashboard/State_Dashboard.jsx"));
const PagenotFound = lazy(() => import("../pages/Dashboard/Pagenotfound/PagenotFound.jsx"));

const ExcelTextUpload = lazy(() => import("../pages/ExcelTextUpload/ExcelTextUpload.jsx"));
const ExcelFileCreation = lazy(() => import("../pages/ExcelFileCreation/ExcelFileCreation.jsx"));
const TemplateExcelUpload = lazy(() => import("../pages/uploadExcel/TemplateExcelUpload.jsx"));
const UploadImages = lazy(() => import("../pages/svnActivity/UploadImages.jsx"));
const AdminWindowsql = lazy(() => import("../pages/adminwindow/AdminWindowsql.jsx"));
const DataBackup = lazy(() => import("../pages/Databackup/DataBackup.jsx"));
const Navbaradd = lazy(() => import("../pages/UserRoll/Navbaradd.jsx"));
const Rollmaster = lazy(() => import("../pages/UserRoll/Rollmaster.jsx"));
const RollexaminerUpdate = lazy(() => import("../pages/UserRoll/RollexaminerUpdate.jsx"));
const Userrolemaster = lazy(() => import("../pages/UserRoleMaster/Userrolemaster.jsx"));
const Userollmaster = lazy(() => import("../pages/UserRoll/Userollmaster.jsx"));
const Admin_Dashboard = lazy(() => import("../pages/Dashboard/admin_dashboard/Admin_Dashboard.jsx"));
const AdminMainDashboard = lazy(() => import("../pages/Dashboard/Admin/AdminMainDashboard.jsx"));
const ModelSchoolAdministratorDashboard = lazy(() => import("../pages/Dashboard/ModelSchoolAdministrator/ModelSchoolAdministratorDashboard.jsx"));
const ModelSchoolAdministratorNewDashboard = lazy(() => import("../pages/Dashboard/ModelSchoolAdministrator/ModelSchoolAdministratorNewDashboard.jsx"));
const ModelSchoolAdministratorStudentsMark = lazy(() => import("../pages/Dashboard/ModelSchoolAdministrator/ModelSchoolAdministratorStudentsMark.jsx"));
const DistrictUploadProcessing = lazy(() => import("../pages/Dashboard/ModelSchoolAdministrator/DistrictUploadProcessing.jsx"));
const ModelSchoolPendingPapers = lazy(() => import("../pages/Dashboard/ModelSchoolAdministrator/ModelSchoolPendingPapers.jsx"));

const ExaminerValuation = lazy(() => import("../pages/Dashboard/Main/ExaminerValuation.jsx"));
const ValuationMain = lazy(() => import("../pages/Valuation/ValuationMain.jsx"));
const ValuationchiefMain = lazy(() => import("../pages/Valuation/ValuationchiefMain.jsx"));
const ReviwChiefMain = lazy(() => import("../pages/Valuation/ReviwChiefMain.jsx"));
const ChiefValuationReview = lazy(() => import("../pages/Dashboard/Examinerreview/ChiefValuationReview.jsx"));
const ChiefValuationReviewMain = lazy(() => import("../pages/Dashboard/Review/ChiefValuationReviewMain.jsx"));
const ExaminerReview = lazy(() => import("../pages/Dashboard/Examinerreview/ExaminerReview.jsx"));
const ReviewExaminer = lazy(() => import("../pages/Dashboard/Review/ReviewExaminer.jsx"));
const SubjectMaster = lazy(() => import("../pages/Dashboard/SubjectMaster/SubjectMaster.jsx"));
const Valid_Qbs_Master = lazy(() => import("../pages/Dashboard/Valid_Qbs/Valid_Qbs_Master.jsx"));
const Valid_Selection = lazy(() => import("../pages/Dashboard/valid_subject/Valid_Selection.jsx"));
const Qp_and_answerKey = lazy(() => import("../pages/Dashboard/QpAndAnswerKey/Qp_and_answerKey.jsx"));
const Qp_and_AnswerKey_upload = lazy(() => import("../pages/Dashboard/QpAndAnswerKey/Qp_and_AnswerKey_upload.jsx"));
const Camp_Details = lazy(() => import("../pages/Dashboard/ValuationStatus/Camp_Details.jsx"));
const Examiner_Alteration = lazy(() => import("../pages/Alteration/Examiner_Alteration.jsx"));
const Chief_Examiner_Alteration = lazy(() => import("../pages/Alteration/Chief_Examiner_Alteration.jsx"));
const Subcode_Details = lazy(() => import("../pages/Dashboard/ValuationStatus/Subcode_Details.jsx"));
const ExaminerSubcode_Details = lazy(() => import("../pages/Dashboard/ValuationStatus/ExaminerSubcode_Details.jsx"));
const ChiefSubcode_Details = lazy(() => import("../pages/Dashboard/ValuationStatus/ChiefSubcode_Details.jsx"));
const RemarksMalpracticeDetails = lazy(() => import("../pages/Dashboard/ValuationStatus/RemarksMalpracticeDetails.jsx"));
const ExaminerPendingDetails = lazy(() => import("../pages/Dashboard/ValuationStatus/ExaminerPendingDetails.jsx"));
const DepartmentMaster = lazy(() => import("../pages/BasicData/DepartmentMaster.jsx"));
const MonthYearMaster = lazy(() => import("../pages/BasicData/MonthYearMaster.jsx"));
const FacultChecking = lazy(() => import("../pages/BasicData/FacultChecking.jsx"));
const Subcode_Examiner_Details = lazy(() => import("../pages/Dashboard/ValuationStatus/Subcode_Examiner_Details.jsx"));
const PaperReviewexaminer = lazy(() => import("../pages/PaperReview/PaperReviewexaminer.jsx"));
const PaperReiewzero = lazy(() => import("../pages/PaperReview/PaperReiewzero.jsx"));
const ValuationCancel = lazy(() => import("../pages/ValuatrionCancel/ValuationCancel.jsx"));
const DataExport = lazy(() => import("../pages/ExportData/DataExport.jsx"));
const ValuationMove = lazy(() => import("../pages/Dashboard/ValuationMove/ValuationMove.jsx"));
const ScanningChecking = lazy(() => import("../pages/ScanningChecking/ScanningChecking.jsx"));
const McqmasterUpdate = lazy(() => import("../pages/McqMaster/McqmasterUpdate.jsx"));
const McqExport = lazy(() => import("../pages/McqMaster/McqExport.jsx"));
const ChiefRemarks = lazy(() => import("../pages/chiefRemarks/ChiefRemarks.jsx"));
const PdfDocument = lazy(() => import("../pages/PdfPrint_Examiner/PdfDocument.jsx"));
const PdfPrintNew = lazy(() => import("../pages/PdfPrint/PdfPrintNew.jsx"));
const PdfDocumentCamp = lazy(() => import("../pages/PdfPrint_Examiner/PdfDocumentCamp.jsx"));
const ExaminerMarkpdf = lazy(() => import("../pages/PdfPrint_Examiner/ExaminerPaypdf.jsx"));
const ExaminerPaymentReport = lazy(() => import("../pages/PayPrint/ExaminerPaymentReport.jsx"));
const ConsolidatedPaymentDetails = lazy(() => import("../pages/PayPrint/ConsolidatedPaymentDetails.jsx"));
const DatTaAllowance = lazy(() => import("../pages/DaTaAllowance/DatTaAllowance.jsx"));
const CandidateExaminerReview = lazy(() => import("../pages/Dashboard/Review/CandidateExaminerReview.jsx"));
const IpConfig = lazy(() => import("../pages/Dashboard/utility/IpConfig.jsx"));
const ExaminerResetPassword = lazy(() => import("../pages/examiner/resetPassword.jsx"));
const UserPassword = lazy(() => import("../pages/examiner/userPassword.jsx"));
const UserTemporaryPassword = lazy(() => import("../pages/examiner/userTemporaryPassword.jsx"));
const ExaminerLoginStatus = lazy(() => import("../pages/ExaminerLoginStatus/ExaminerLoginStatus.jsx"));

const LazyRoute = (props) => (
  <Suspense fallback={<div>Loading...</div>}>
    {React.createElement(props.component)}
  </Suspense>
);

const router = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<Renderpage />}>
    <Route index element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LazyRoute component={Login} />} />
    <Route element={<Protected />}>
      <Route path="/profile" element={<LazyRoute component={Profile} />} />
      <Route path="/reset-password" element={<LazyRoute component={ResetPassword} />} />
      <Route path="/common/dashboard" element={<LazyRoute component={CommonDashboar} />} />
      <Route path="/district/common/dashboard" element={<LazyRoute component={District_Common_Dashboard} />} />
      <Route path="/state/common/dashboard" element={<Navigate to="/state/dashboard" replace />} />
      <Route path="/zone/common/dashboard" element={<LazyRoute component={Zone_common_Dashboard} />} />
      <Route path="/headmaster/common/dashboard" element={<LazyRoute component={HeadMaster_Common_Dashboard} />} />
      <Route path="/district-officials/common/dashboard" element={<LazyRoute component={DistrictOfficials_Common_Dashboard} />} />
      <Route path="/state-coordinator/common/dashboard" element={<LazyRoute component={StateCoordinator_Common_Dashboard} />} />
      <Route path="/state-assistant/common/dashboard" element={<LazyRoute component={StateAssistant_Common_Dashboard} />} />
      <Route path="/district/dashboard" element={<LazyRoute component={District_Dashboard} />} />
      <Route path="/state/dashboard" element={<LazyRoute component={State_Dashboard} />} />
      <Route path="/admin/admin-window" element={<LazyRoute component={AdminWindowsql} />} />
      <Route path="/admin/navbaradd" element={<LazyRoute component={Navbaradd} />} />
      <Route path="/admin/data-backup" element={<LazyRoute component={DataBackup} />} />
      <Route path="/admin/rollmaster" element={<LazyRoute component={Rollmaster} />} />
      <Route path="/admin/examinerrollupdate" element={<LazyRoute component={RollexaminerUpdate} />} />
      <Route path="/admin/userMaster" element={<LazyRoute component={Userrolemaster} />} />
      <Route path="/admin/dashboard" element={<LazyRoute component={Admin_Dashboard} />} />
      <Route path="/admin/main-dashboard" element={<LazyRoute component={AdminMainDashboard} />} />
      <Route path="/model-school-administrator/dashboard" element={<LazyRoute component={ModelSchoolAdministratorDashboard} />} />
      <Route path="/model-school-administrator/new-dashboard" element={<LazyRoute component={ModelSchoolAdministratorNewDashboard} />} />
      <Route path="/model-school-administrator/students-mark" element={<LazyRoute component={ModelSchoolAdministratorStudentsMark} />} />
      <Route path="/model-school-administrator/uploads" element={<LazyRoute component={DistrictUploadProcessing} />} />
      <Route path="/model-school-administrator/pending-papers" element={<LazyRoute component={ModelSchoolPendingPapers} />} />
      <Route path="/svn/uploadImages" element={<LazyRoute component={UploadImages} />} />
      <Route path="/svn/excel-file-creation" element={<LazyRoute component={ExcelFileCreation} />} />
      <Route path="/svn/excel-text-upload" element={<LazyRoute component={ExcelTextUpload} />} />
      <Route path="/excel-text-upload" element={<LazyRoute component={ExcelTextUpload} />} />
      <Route path="/svn/template-excel-upload" element={<LazyRoute component={TemplateExcelUpload} />} />
      <Route path="/examiner/valuation-review" element={<LazyRoute component={ExaminerValuation} />} />
      <Route path="/valuation" element={<LazyRoute component={ValuationMain} />} />
      <Route path="/valuation/chief-valuation" element={<LazyRoute component={ValuationchiefMain} />} />
      <Route path="/valuation/chief-review" element={<LazyRoute component={ReviwChiefMain} />} />
      <Route path="/valuation/chief-valuation-review-main" element={<LazyRoute component={ChiefValuationReviewMain} />} />
      <Route path="/valuation/chief-valuation-review" element={<LazyRoute component={ChiefValuationReview} />} />
      <Route path="/examiner/review" element={<LazyRoute component={ExaminerReview} />} />
      <Route path="/examiner/reviewe/valuationreview" element={<LazyRoute component={ReviewExaminer} />} />
      <Route path="/admin/subject_master_dashboard" element={<LazyRoute component={SubjectMaster} />} />
      <Route path="/admin/valid_qbs_master" element={<LazyRoute component={Valid_Qbs_Master} />} />
      <Route path="/admin/valid_selection" element={<LazyRoute component={Valid_Selection} />} />
      <Route path="/admin/qp_and_answerkey" element={<LazyRoute component={Qp_and_answerKey} />} />
      <Route path="/admin/qp_and_answerkey_upload" element={<LazyRoute component={Qp_and_AnswerKey_upload} />} />
      <Route path="/admin/camp_details" element={<LazyRoute component={Camp_Details} />} />
      <Route path="/examiner_alteration" element={<LazyRoute component={Examiner_Alteration} />} />
      <Route path="/chief_examiner_alteration" element={<LazyRoute component={Chief_Examiner_Alteration} />} />
      <Route path="/admin/subcode_details" element={<LazyRoute component={Subcode_Details} />} />
      <Route path="/admin/examiner_subcode_details" element={<LazyRoute component={ExaminerSubcode_Details} />} />
      <Route path="/admin/chief_subcode_details" element={<LazyRoute component={ChiefSubcode_Details} />} />
      <Route path="/admin/remarks_malpractice" element={<LazyRoute component={RemarksMalpracticeDetails} />} />
      <Route path="/admin/paper_locked_pending" element={<LazyRoute component={ExaminerPendingDetails} />} />
      <Route path="/admin/degree-master" element={<LazyRoute component={DepartmentMaster} />} />
      <Route path="/admin/month-year" element={<LazyRoute component={MonthYearMaster} />} />
      <Route path="/admin/faculty-checking" element={<LazyRoute component={FacultChecking} />} />
      <Route path="/admin/subcode_evaluation_status_examiner" element={<LazyRoute component={Subcode_Examiner_Details} />} />
      <Route path="/paper-review-data" element={<LazyRoute component={PaperReviewexaminer} />} />
      <Route path="/paper-review-zero" element={<LazyRoute component={PaperReiewzero} />} />
      <Route path="/admin/valuation-cancel" element={<LazyRoute component={ValuationCancel} />} />
      <Route path="/admin/export-data" element={<LazyRoute component={DataExport} />} />
      <Route path="/admin/valuation-move" element={<LazyRoute component={ValuationMove} />} />
      <Route path="/admin/scanning-valuation-data" element={<LazyRoute component={ScanningChecking} />} />
      <Route path="/master/mcqmaster-update" element={<LazyRoute component={McqmasterUpdate} />} />
      <Route path="/master/mcqmaster-export" element={<LazyRoute component={McqExport} />} />
      <Route path="/chiefRemarks" element={<LazyRoute component={ChiefRemarks} />} />
      <Route path="/Evaluator/PrintPdf" element={<LazyRoute component={PdfDocument} />} />
      <Route path="/Evaluator/PrintPdfNew" element={<LazyRoute component={PdfPrintNew} />} />
      <Route path="/Evaluator-camp/PrintPdf" element={<LazyRoute component={PdfDocumentCamp} />} />
      <Route path="/Evaluator/Payment" element={<LazyRoute component={ExaminerMarkpdf} />} />
      <Route path="/Evaluator/examiner-payment-report" element={<LazyRoute component={ExaminerPaymentReport} />} />
      <Route path="/admin/consolidated-payment-details" element={<LazyRoute component={ConsolidatedPaymentDetails} />} />
      <Route path="/data-allowance" element={<LazyRoute component={DatTaAllowance} />} />
      <Route path="/candidate/valuation-review-main" element={<LazyRoute component={CandidateExaminerReview} />} />
      <Route path="/ip-config" element={<LazyRoute component={IpConfig} />} />
      <Route path="/examiner/resetpassword" element={<LazyRoute component={ExaminerResetPassword} />} />
      <Route path="/examiner/userpassword" element={<LazyRoute component={UserPassword} />} />
      <Route path="/examiner/temporary-password" element={<LazyRoute component={UserTemporaryPassword} />} />
      <Route path="/examiner/examinerstatus" element={<LazyRoute component={ExaminerLoginStatus} />} />
      <Route path="/admin/admin-rollupdate" element={<LazyRoute component={Userollmaster} />} />
    </Route>
    <Route path="*" element={<LazyRoute component={PagenotFound} />} />
  </Route>
));

const AppRouter = () => (
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);

export default AppRouter;