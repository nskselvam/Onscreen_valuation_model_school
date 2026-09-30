import React from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import { useDispatch } from "react-redux";
import { setCurrentSubCode, setDashboardData } from "../../../redux-slice/valuationSlice";
import { useNavigate } from "react-router-dom";
import getCurrentISTDateTime from "../utility/CurrentISTDateTime";
import { useGetDashboarddatasubcodeQuery } from "../../../redux-slice/userDashboardSlice";
import { useGetValuationDataQuery } from "../../../redux-slice/valuationApiSlice";
import "../../../style/examinerDashboard.css";

const buildQuestionSetFromRange = (validQuestion) => {
  const expected = new Set();

  (validQuestion || []).forEach((question) => {
    const from = Number(question.FROM_QST ?? question.FROMQST ?? question.FROM ?? 0);
    const to = Number(question.TO_QST ?? question.TOQST ?? question.TO ?? 0);

    if (!Number.isFinite(from) || !Number.isFinite(to)) return;

    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let i = start; i <= end; i += 1) {
      expected.add(i);
    }
  });

  return expected;
};

const buildQuestionSetFromSections = (validSection) => {
  const actual = new Set();

  (validSection || []).forEach((section) => {
    const qnum = Number(section.qstn_num ?? section.qstnNum ?? section.qbno ?? 0);
    if (Number.isFinite(qnum) && qnum > 0) {
      actual.add(qnum);
    }
  });

  return actual;
};

const getQuestionMismatch = (valuationData) => {
  const validQuestion = valuationData?.Valid_Question || [];
  const validSection = valuationData?.Valid_Section || [];

  if (validQuestion.length === 0 || validSection.length === 0) return null;

  const expected = buildQuestionSetFromRange(validQuestion);
  const actual = buildQuestionSetFromSections(validSection);

  if (expected.size === 0) return null;

  const missing = Array.from(expected).filter((q) => !actual.has(q));
  const extra = Array.from(actual).filter((q) => !expected.has(q));
  const hasMismatch = missing.length > 0 || extra.length > 0;

  return {
    hasMismatch,
    expectedCount: expected.size,
    actualCount: actual.size,
  };
};

const ExaminerCard = ({
  item,
  index,
  user_Info,
  currentDate,
  dashboardData,
  getCardTheme,
  Examination_Valuation,
  handleSubcodeClick,
  handleReviewClick,
}) => {
  const { data: valuationData } = useGetValuationDataQuery(
    { subcode: item.sub_code, testcode: item.testcode },
    { skip: !item?.sub_code }
  );


  const mismatch = React.useMemo(
    () => getQuestionMismatch(valuationData),
    [valuationData]
  );
  const hasMismatch = Boolean(mismatch?.hasMismatch);


  // Single row per subcode — find across all import tables
  const overallRecord =
    dashboardData?.import1?.find((d) => d.subcode === item.sub_code && d.testcode === item.testcode) ||
    dashboardData?.import2?.find((d) => d.subcode === item.sub_code) ||
    dashboardData?.import3?.find((d) => d.subcode === item.sub_code) ||
    dashboardData?.import4?.find((d) => d.subcode === item.sub_code);

  // today's script count (all scripts assigned today for this subcode)
  const todayScriptTotal = Number(overallRecord?.checkdate_group_total) || 0;
  // total scripts for the subcode (all examiners)
  const overallTotal = Number(overallRecord?.overall_subcode_total) || 0;
  // total scripts checked = 'Yes' by this specific examiner (overall)
  const overallEvaluated = Number(overallRecord?.overall_examiner_total) || 0;
  // total scripts checked = 'Yes' across all examiners
  const overallCheckedTotal = Number(overallRecord?.overall_checked_total) || 0;
  // today's checked count for this specific examiner
  const todayExaminerTotal = Number(overallRecord?.checkdate_examiner_total) || 0;
  const pendingScripts = overallTotal - overallCheckedTotal;
  const progressPercentage =
    overallTotal > 0 ? (overallCheckedTotal / overallTotal) * 100 : 0;


  return (
    <Card
      key={`${item.sub_code}_${item.testcode || 'default'}`}
      className={`examiner-card ${getCardTheme(index)}`}
      text="white"
    >
      <Card.Body className="d-flex flex-column">
        {/* Subject Header */}
        <div className="subject-header">
          <span className="subject-code-badge">{item.sub_code}</span>
          <div className="subject-name">{item.sub_name}</div>
          {item.testcode && <div className="subject-testcode">Test Code: {item.testcode}</div>}
        </div>

        {/* Valuation Info Bar */}
        <div className="valuation-info-bar">
          <div className="valuation-type-badge">
            <span className="roman-numeral">
              {Examination_Valuation[item.Eva_subject_dashboard - 1]}
            </span>
            <span>Valuation</span>
          </div>
          <div className="today-stats">
            <span className="stat-icon">📊</span>
            <span>Today Evaluated ({currentDate}):</span>
            <span className="stat-value">{todayExaminerTotal}</span>
          </div>
        </div>

        {/* Subjwise Alloted Paper - Only show if Sub_Max_Papers is not 0 */}
        {item.Sub_Max_Papers && Number(item.Sub_Max_Papers) !== 0 && (
          <div className="alloted-paper-info">
            <span className="stat-icon">📋</span>
            <span>Subject wise Alloted Paper:</span>
            <span className="stat-value">{item.Sub_Max_Papers}</span>
          </div>
        )}

        {hasMismatch && (
          <div className="question-mismatch-alert">
            <span className="alert-icon">⚠️</span>
            <span>
              Question setup mismatch ({mismatch.actualCount}/
              {mismatch.expectedCount})
            </span>
          </div>
        )}

        {/* Action Bar */}
        <div className="action-bar">
          <DropdownButton
            id={`dropdown-${item.sub_code}-${item.testcode || 'default'}`}
            title={
              <>
                <span style={{ marginRight: "8px" }}>⚡</span>
                Select Action
              </>
            }
            variant="light"
            className="action-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {pendingScripts > 0 && (
              <Dropdown.Item
                disabled={hasMismatch || item.mismatch_flg === "N" || item.qbs_status === "N" || item.Examiner_Valuation_Status === "Y" || (item.key_status === "N" && item.exam_type === "R" )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasMismatch) return;
                  handleSubcodeClick(
                    item.department,
                    item.sub_code,
                    item.sub_name,
                    item.testcode,
                    item.Eva_subject_dashboard || "1",
                    item.Max_Papers || "50",
                    item.Sub_Max_Papers || "50",
                    item.Camp_id || "1",
                    item.camp_offcer_id_examiner || "1",
                    user_Info?.selected_role || user_Info?.Role || "11",
                    user_Info?.name || user_Info?.User_Name,
                    user_Info?.username || user_Info?.User_Id,
                    "evaluation"
                  );
                }}
              >
                <span className="action-icon">📝</span>
                <span>Evaluation</span>
              </Dropdown.Item>
            )}
            {overallTotal > 0 && (
              <Dropdown.Item
              disabled={overallEvaluated> 0 ? false : true}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewClick(
                    // item.sub_code, "review"
                    item.department,
                    item.sub_code,
                    item.sub_name,
                    item.testcode,
                    item.Eva_subject_dashboard,
                    item.Max_Papers,
                    item.Sub_Max_Papers,
                    item.Camp_id,
                    item.camp_offcer_id_examiner,
                    user_Info?.selected_role,
                    user_Info?.name,
                    user_Info?.username,
                    "review"
                  
                  );
                }}
              >
                <span className="action-icon">🔍</span>
                <span>Review</span>
              </Dropdown.Item>
            )}
          </DropdownButton>

          {/* Pending Scripts Display */}
          <div className="pending-scripts-container">
            <div className="pending-scripts-label">Pending Total Scripts</div>
            <div className="pending-scripts-value">
              <span className="evaluated">{overallCheckedTotal}</span>
              <span className="separator">/</span>
              <span className="total">{overallTotal}</span>
            </div>
            <div className="pending-scripts-label" style={{ fontSize: "11px", marginTop: "2px" }}>
              My Evaluated: <strong>{overallEvaluated}</strong>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {(item.qbs_status === "N" || item.mismatch_flg === "N" || item.Examiner_Valuation_Status === "Y" || (item.key_status === "N" && item.exam_type === "R")) && (
          <div className="status-alerts">
            {item.qbs_status === "N" && (
              <div className="status-alert">
                <span className="alert-icon">⚠️</span>
                <span>Question Paper Not Uploaded</span>
              </div>
            )}
            {item.key_status === "N" && item.exam_type === "R" && (
              <div className="status-alert">
                <span className="alert-icon">⚠️</span>
                <span>Answer Key Not Uploaded</span>
              </div>
            )}
            {item.mismatch_flg === "N" && (
              <div className="status-alert">
                <span className="alert-icon">⚠️</span>
                <span>Section & Valid Mismatch </span>
              </div>
            )}
            {item.Examiner_Valuation_Status === "Y" && (
              <div className="status-alert">
                <span className="alert-icon">✅</span>
                <span>Already Evaluated</span>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const ExaminerDashboard = ({ Examiner_data, user_Info, filterStatus }) => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const Subtotal = {
    department: user_Info?.selected_course,
    role: user_Info?.selected_role,
    subcode: user_Info?.subcode,
    Eva_Subject: user_Info?.Eva_Subject,
    Eva_Id: user_Info?.username,
    eva_month_year: user_Info?.eva_month_year,

  };

  console.log("Examiner Dashboard Data: ", Examiner_data);

  if(filterStatus === 'evaluated') {
    Examiner_data = Examiner_data.filter(item => item.Examiner_Valuation_Status === 'Y');
  } else if(filterStatus === 'notEvaluated') {
    Examiner_data = Examiner_data.filter(item => item.Examiner_Valuation_Status !== 'Y');
  }

  const Examination_Valuation = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ];
  
  // Premium card themes for executive view
  const cardThemes = [
    "card-theme-blue",
    "card-theme-emerald",
    "card-theme-purple",
    "card-theme-orange",
    "card-theme-teal",
    "card-theme-indigo",
    "card-theme-rose",
  ];

  //variable declaration for fetching dashboard data based on subcode



  const {
    data: DashboardDataTotal,
    error,
    isLoading,
  } = useGetDashboarddatasubcodeQuery(Subtotal, { pollingInterval: 100000 });

  

  const CurentDateTime = getCurrentISTDateTime().toString().substring(0, 10);

  const getCardTheme = (index) => {
    return cardThemes[index % cardThemes.length];
  };
  
  const handleSubcodeClick = (
    department,
    sub_code,
    sub_name,
    testcode,
    Eva_subject_dashboard,
    Max_Papers,
    Sub_Max_Papers,
    Camp_id,
    camp_offcer_id_examiner,
    selected_role,
    ExaminerName,
    Eva_Id,
    type,
  ) => {
    dispatch(setCurrentSubCode(sub_code));
    dispatch(setDashboardData({ 
      department: department,
      sub_code,
      sub_name,
      testcode,
      Eva_subject_dashboard: Eva_subject_dashboard || "1",
      Max_Papers: Max_Papers || "50",
      Sub_Max_Papers: Sub_Max_Papers || "50",
      Camp_id: Camp_id || "1",
      camp_offcer_id_examiner: camp_offcer_id_examiner || "1",
      selected_role: selected_role || "11",
      ExaminerName: ExaminerName,
      Eva_Id: Eva_Id,
      type: type || "evaluation",
    }));

    navigate("/valuation", {
      state: {
        department: department,
        subcode: sub_code,
        sub_name: sub_name,
        testcode,
        valuation_type: Eva_subject_dashboard || "1",
        Max_Papers: Max_Papers || "50",
        Sub_Max_Papers: Sub_Max_Papers || "50",
        Camp_id: Camp_id || "1",
        camp_offcer_id_examiner: camp_offcer_id_examiner || "1",
        selected_role: selected_role || "11",
        Eva_Mon_Year: user_Info?.eva_month_year,
        type: type || "evaluation",
        Examiner_Name: ExaminerName,
        Eva_Id: Eva_Id,
      },
    });
  };
  const handleReviewClick = (
    department,
    sub_code,
    sub_name,
    testcode,
    Eva_subject_dashboard,
    Max_Papers,
    Sub_Max_Papers,
    Camp_id,
    camp_offcer_id_examiner,
    selected_role,
    ExaminerName,
    Eva_Id,
    type,
  ) => {

    dispatch(setCurrentSubCode(sub_code));
    dispatch(setDashboardData( { 
    department,
    sub_code,
    sub_name,
    testcode,
    Eva_subject_dashboard,
    Max_Papers,
    Sub_Max_Papers,
    Camp_id,
    camp_offcer_id_examiner,
    selected_role,
    ExaminerName,
    Eva_Id,
    type,
  }
    ));
    navigate("/examiner/review", {
     state: {
        department: department,
        subcode: sub_code,
        sub_name: sub_name,
        testcode,
        valuation_type: Eva_subject_dashboard,
        Max_Papers: Max_Papers,
        Sub_Max_Papers: Sub_Max_Papers,
        Camp_id: Camp_id,
        camp_offcer_id_examiner: camp_offcer_id_examiner,
        selected_role: selected_role,
        Eva_Mon_Year: user_Info?.eva_month_year,
        type: type,
        Examiner_Name: ExaminerName,
        Eva_Id: Eva_Id,
      },
    });
  };

  //function to render each subcode card with data

  return (
    <div className="dashboard-cards-grid">
      {Examiner_data.map((item, index) => (

        <ExaminerCard
          key={`${item.sub_code}_${item.testcode || 'default'}`}
          item={item}
          index={index}
          user_Info={user_Info}
          currentDate={CurentDateTime}
          dashboardData={DashboardDataTotal}
          getCardTheme={getCardTheme}
          Examination_Valuation={Examination_Valuation}
          handleSubcodeClick={handleSubcodeClick}
          handleReviewClick={handleReviewClick}
        />
      ))}
    </div>
  );
};

export default ExaminerDashboard;
