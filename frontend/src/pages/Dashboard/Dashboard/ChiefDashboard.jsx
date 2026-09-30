import React from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import getCurrentISTDateTime from "../utility/CurrentISTDateTime";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  setChiefValuationData,
  clearChiefValuationData,
} from "../../../redux-slice/valuationSlice";
import { useGetDashboarddatasubcodechiefQuery } from "../../../redux-slice/userDashboardSlice";
import "../../../style/examinerDashboard.css";

const ChiefDashboard = ({ Chief_data, user_Info , filterStatus }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const CurentDateTime = getCurrentISTDateTime();
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
    "card-theme-indigo",
    "card-theme-teal",
    "card-theme-purple",
    "card-theme-blue",
    "card-theme-emerald",
    "card-theme-rose",
    "card-theme-orange",
  ];

  const Chiefsubcodevaluationcount = {
  department: user_Info.selected_course,
  role: user_Info.selected_role,
  Chief_subcode: user_Info.Chief_subcode,
  chief_examiner: user_Info.chief_examiner,
  Chief_Eva_Subjects: user_Info.Chief_Eva_Subjects,
  Chief_Valuation_Status: user_Info.Chief_Valuation_Status,
  Eva_Id: user_Info.username
  }


  const getCardTheme = (index) => {
    return cardThemes[index % cardThemes.length];
  };

const Dashboarddatasubcodechief = useGetDashboarddatasubcodechiefQuery(Chiefsubcodevaluationcount, {
  refetchOnMountOrArgChange: true,
});

// Filter data based on status
let filteredData = Dashboarddatasubcodechief?.data?.data || [];
if(filterStatus === 'evaluated') {
  filteredData = filteredData.filter(item => item.Chief_Valuation_Status === 'Y');
} else if(filterStatus === 'notEvaluated') {
  filteredData = filteredData.filter(item => item.Chief_Valuation_Status !== 'Y');
}


console.log("Chief Dashboard Data: ", Dashboarddatasubcodechief);

  const handleChief_SubcodeClick = (
    chief_sub_code,
    chief_sub_name,
    Chief_Eva_subject_dashboard,
    camp_id_chief,
    camp_office_id_chief,
    chief_examiner,
    chief_examiner_name,
    Evaluator_Id,
    Examiner_type,
  ) => {
    // Dispatch action or navigate as needed
    dispatch(
      setChiefValuationData({
        chief_sub_code,
        chief_sub_name,
        Chief_Eva_subject_dashboard: String(Chief_Eva_subject_dashboard),
        camp_id_chief,
        camp_office_id_chief,
        chief_examiner,
        chief_examiner_name,
        Evaluator_Id,
        Examiner_type,
      })
    );

    navigate("/valuation/chief-valuation-review");
  };

return (
  <div className="dashboard-cards-grid">
    {filteredData.map((chief_item, chief_index) => {
      // const todayRecord = Array.isArray(Dashboarddatasubcodechief?.data?.data) 
      //   ? Dashboarddatasubcodechief.data.data.find(
      //       (d) =>
      //         (d.subcode === chief_item.chief_sub_code && d.Evaluator_Id === chief_item.chief_examiner) 
      //     )
      //   : null;
      
      const percentage = chief_item.overall_evaluator_checked > 0
        ? parseFloat(((chief_item.overall_chief_checked / chief_item.overall_evaluator_checked) * 100).toFixed(2))
        : 0;
      console.log(`Progress for ${chief_item.chief_sub_code}: ${percentage}%`);

      const checkedCount = chief_item?.overall_chief_checked || 0;
      const totalChecked = chief_item?.overall_evaluator_checked || 0;
      const overall_chief_reviewed = chief_item?.overall_chief_reviewed || 0;
     // console.log(`Checked Count: ${chief_item.subcode}, Total Checked: ${totalChecked}`);


      let subname = (Array.isArray(Chief_data) ? Chief_data : []).find((item) => item.chief_sub_code === chief_item.subcode) || {
        chief_sub_name: chief_item.subcode,
        Camp_id_chief: '',
        camp_offcer_id_chief: '',
        chief_examiner: '',
        chief_examiner_name: ''
      };

      // let percentage = 0;
      // let checkedCount = 0;
      // let totalChecked = 0;
       //let todayRecord = 0;

      return (
        <Card
          key={`${chief_item.Evaluator_Id}-${chief_item.subcode}-${chief_index}`}
          className={`examiner-card ${getCardTheme(chief_index)}`}
          text="white"
        >
          <Card.Body className="d-flex flex-column">
            {/* Examiner Header */}
            <div className="subject-header">
              <span className="subject-code-badge">
                {chief_item.Evaluator_Id}
              </span>
              <div className="subject-name">
                {chief_item.Evaluator_Name} - {chief_item.Evaluator_Mobile}
              </div>
            </div>

            {/* Subject Info Bar */}
            <div className="valuation-info-bar">
              <div className="valuation-type-badge">
                <span className="roman-numeral">
                  {Examination_Valuation[chief_item.Chief_Eva_subject_dashboard - 1]}
                </span>
                <span>Valuation - {Examination_Valuation[chief_item.Evaluation_Status - 1]}</span>
              </div>
              <div className="today-stats">
                <span className="stat-icon">📚</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  {chief_item.subcode} - {subname.chief_sub_name}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
              <DropdownButton
                id={`dropdown-${chief_item.subcode}`}
                title={
                  <>
                    <span style={{ marginRight: '8px' }}>⚡</span>
                    Select Action
                   
                  </>
                }
                variant="light"
                className="action-dropdown"
                onClick={(e) => e.stopPropagation()}
                disabled={chief_item.Chief_Valuation_Status === 'Y'}
              >
                <Dropdown.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChief_SubcodeClick(
                      chief_item.subcode,
                      subname.chief_sub_name,
                      chief_item.Evaluation_Status,
                      subname.Camp_id_chief,
                      subname.camp_offcer_id_chief,
                      subname.chief_examiner,
                      subname.chief_examiner_name,
                      chief_item.Evaluator_Id,

                      "1"
                    );
                  }}
                  disabled={chief_item.Chief_Valuation_Status === 'Y'}
                >
                  <span className="action-icon">📝</span>
                  <span>Evaluation</span>
                </Dropdown.Item>
  {percentage >= 10 && (
                <Dropdown.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChief_SubcodeClick(
                      chief_item.subcode,
                      subname.chief_sub_name,
                      chief_item.Evaluation_Status,
                      subname.Camp_id_chief,
                      subname.camp_offcer_id_chief,
                      subname.chief_examiner,
                      chief_item.Evaluator_Name,
                      chief_item.Evaluator_Id,
                      "7"
                    );
                  }}
                  disabled={chief_item.Chief_Valuation_Status === 'Y'}
                >
              
                  <>
                    <span className="action-icon">🔍</span>
                    <span>Review</span>
                  </>
                </Dropdown.Item>
              )}
              </DropdownButton>

              {/* Progress Display */}
              <div className="pending-scripts-container">
                <div className="pending-scripts-label">Review Progress</div>
                <div className="pending-scripts-value" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span className="evaluated">{checkedCount}</span>
                  <span className="separator">/</span>
                  <span className="total">{totalChecked}</span>
                  {chief_item && (
                    <span style={{ 
                      marginLeft: '8px', 
                      background: percentage >= 10 ? 'rgba(39, 174, 96, 0.4)' : 'rgba(255,255,255,0.2)', 
                      color: percentage >= 10 ? '#c8ffdc' : 'inherit',
                      padding: '2px 8px', 
                      borderRadius: '6px',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {percentage}%
                    </span>
                  )}
                  {overall_chief_reviewed > 0 && (
                    <span style={{ 
                      marginLeft: '8px', 
                      background: 'rgba(52, 152, 219, 0.4)', 
                      color: '#d4e9ff',
                      padding: '2px 8px', 
                      borderRadius: '6px',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      Reviewed  - {overall_chief_reviewed}  
                    </span>
                  )}
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {chief_item.Chief_Valuation_Status === 'Y' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(39, 174, 96, 0.3)',
                    color: '#c8ffdc',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    border: '1px solid rgba(39, 174, 96, 0.5)'
                  }}>
                    ✓ Chief Valuation Completed
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
        );
      })}
    </div>
  );
};

export default ChiefDashboard;
