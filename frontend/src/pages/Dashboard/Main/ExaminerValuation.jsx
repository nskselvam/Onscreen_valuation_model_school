import React, { useEffect, useMemo, useState } from "react";
import UploadPageLayout from "../../../components/DashboardComponents/UploadPageLayout";
import { Card, ButtonGroup, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useGetValuationfetchDataQuery } from "../../../redux-slice/userDashboardSlice";
import ExaminerDashboard from "../Dashboard/ExaminerDashboard";
import ChiefDashboard from "../Dashboard/ChiefDashboard.jsx";
import McqOperationData from "../../../components/McqOperation/McqOperationData.jsx";
import { useGetCommonDataQuery } from '../../../redux-slice/getDataCommonRouterdata';
import PaperReviewexaminer from '../../PaperReview/ExaminerpaperReview.jsx'
const ExaminerValuation = () => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'evaluated', 'notEvaluated'
  const userInfo = useSelector((state) => state.auth.userInfo);
  const Dep_Name = useSelector((state) => state?.auth?.userInfo?.selected_course);

  const LoginUserRole = userInfo?.selected_role ?? userInfo?.Role ?? userInfo?.role ?? userInfo?.user_Type;
  const isRole3 = parseInt(LoginUserRole) === 3;

  const { data: SubCodedata, error: error2 } = useGetCommonDataQuery(
    { tableId: 'sub_master', ...(Dep_Name ? { Dep_Name } : {}) },
    { skip: isRole3 }
  );

  useEffect(() => {
    if (error2) {
      console.error("Error fetching sub_master data: ", error2);
    }
  }, [error2]);

  const Eva_id = useSelector((state) => state.auth.userInfo?.username || state.auth.userInfo?.User_Id);

  // Filter data where mcq_flg is "Y", Eva_Id matches current user, and mcq_updates is not 'Y'
  const filteredMcqData = useMemo(() => {
    if (!SubCodedata?.data || !Array.isArray(SubCodedata.data)) return [];
    return SubCodedata.data.filter(item =>
      item.mcq_flg === "Y" &&
      item.Eva_Id == Eva_id &&
      item.mcq_updates !== 'Y'
    );
  }, [SubCodedata, Eva_id]);

  const userHeader = (LoginUserRole == 2 || LoginUserRole == 11) ? "Examiner & Review" : "Chief Examiner & Review";

  let basicDepartment = `Dep_Name_${LoginUserRole}`;
  const basic_info_data = {
    department: userInfo[basicDepartment] || userInfo.D_Code || "",
    role: userInfo.role || userInfo.Role || "",
    subcode: userInfo.examiner_subcode || userInfo.subcode || "",
    Eva_Subject: userInfo.Eva_Subject || "1",
    Max_Papers_subject: userInfo.Max_Papers_subject || "50",
    Sub_Max_Papers: userInfo.Sub_Max_Papers || "50",
    chief_examiner: userInfo.chief_examiner || "",
    Chief_subcode: userInfo.Chief_subcode || "",
    Chief_Eva_Subjects: userInfo.Chief_Eva_Subjects || "",
    Camp_id: userInfo.Camp_id || "1",
    camp_offcer_id_examiner: userInfo.camp_offcer_id_examiner || "1",
    Camp_id_chief: userInfo.Camp_id_chief || "1",
    camp_offcer_id_chief: userInfo.camp_offcer_id_chief || "1",
    Examiner_Valuation_Status: userInfo.Examiner_Valuation_Status || "N",
    Chief_Valuation_Status: userInfo.Chief_Valuation_Status || "N",
    Dep_Name: userInfo.selected_course || Dep_Name || "",
    rolefinal: LoginUserRole || ""
  };


  const {
    data: dataFromSubcodeTest,
    error,
  } = useGetValuationfetchDataQuery(basic_info_data, { skip: isRole3 });



  useEffect(() => {
    if (error) {
      console.error("Error fetching valuation data: ", error);
    }
  }, [error]);

  // Render MCQ interface if examiner has any MCQ subjects assigned
  const hasMcqSubjects = filteredMcqData.length > 0;

  if (isRole3) {
    return <PaperReviewexaminer />;
  }

  if (hasMcqSubjects) {
    return (
      <McqOperationData />
    );
  }

  return (
    <>
      {LoginUserRole != 3 ? (
        <UploadPageLayout
          mainTopic={userHeader}
          subTopic="Comprehensive overview and management of examiner valuations"
          cardTitle={
            <div className="d-flex justify-content-between align-items-center w-100" style={{ gap: '20px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#2c5282' }}>Valuation Details</span>
              <ButtonGroup>
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setFilterStatus('all')}
                  style={{
                    fontWeight: filterStatus === 'all' ? '600' : '400',
                    minWidth: '110px',
                    padding: '6px 16px',
                    fontSize: '14px'
                  }}
                >
                  Allotted Subject
                </Button>
                <Button
                  variant={filterStatus === 'evaluated' ? 'success' : 'outline-success'}
                  onClick={() => setFilterStatus('evaluated')}
                  style={{
                    fontWeight: filterStatus === 'evaluated' ? '600' : '400',
                    minWidth: '110px',
                    padding: '6px 16px',
                    fontSize: '14px'
                  }}
                >
                  Evaluated Subject
                </Button>
                <Button
                  variant={filterStatus === 'notEvaluated' ? 'warning' : 'outline-warning'}
                  onClick={() => setFilterStatus('notEvaluated')}
                  style={{
                    fontWeight: filterStatus === 'notEvaluated' ? '600' : '400',
                    minWidth: '110px',
                    padding: '6px 16px',
                    fontSize: '14px'
                  }}
                >
                 Pending Subject
                </Button>
              </ButtonGroup>
            </div>
          }


        >
          <div style={{ width: '100%' }}>
            {dataFromSubcodeTest?.subcode_subjects &&
              dataFromSubcodeTest.subcode_subjects.length > 0 &&
              (LoginUserRole == 2 || LoginUserRole == 11) ? (
              <ExaminerDashboard
                Examiner_data={dataFromSubcodeTest.subcode_subjects}
                user_Info={userInfo}
                filterStatus={filterStatus}
                
              />
            ) : dataFromSubcodeTest?.chief_subcode_subjects &&
              dataFromSubcodeTest.chief_subcode_subjects.length > 0 &&
              ((LoginUserRole == 7 || LoginUserRole == 1) && LoginUserRole != 3) ? (
              <>
                <ChiefDashboard
                  Chief_data={dataFromSubcodeTest.chief_subcode_subjects}
                  user_Info={userInfo}
                  filterStatus={filterStatus}

                />
              </>
            ) : LoginUserRole == 3 ? (
              <>
                <PaperReviewexaminer />
              </>
            ) : dataFromSubcodeTest?.subcode_subjects && dataFromSubcodeTest.subcode_subjects.length > 0 ? (
              <ExaminerDashboard
                Examiner_data={dataFromSubcodeTest.subcode_subjects}
                user_Info={userInfo}
                filterStatus={filterStatus}
              />
            ) : (
              <div className="text-center p-5">
                <Card style={{
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  borderRadius: '16px'
                }}>
                  <Card.Body className="py-5">
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>No subcodes assigned.</p>
                  </Card.Body>
                </Card>
              </div>
            )}
          </div>
        </UploadPageLayout>
      ) : (
        <div style={{ width: '100%' }}>
          {dataFromSubcodeTest?.subcode_subjects &&
            dataFromSubcodeTest.subcode_subjects.length > 0 &&
            LoginUserRole == 2 && LoginUserRole != 3 ? (
            <ExaminerDashboard
              Examiner_data={dataFromSubcodeTest.subcode_subjects}
              user_Info={userInfo}
            />
          ) : dataFromSubcodeTest?.chief_subcode_subjects &&
            dataFromSubcodeTest.chief_subcode_subjects.length > 0 &&
            ((LoginUserRole == 7 || LoginUserRole == 1) && LoginUserRole != 3) ? (
            <>
              <ChiefDashboard
                Chief_data={dataFromSubcodeTest.chief_subcode_subjects}
                user_Info={userInfo}
              />
            </>
          ) : LoginUserRole == 3 ? (
            <>
              <PaperReviewexaminer
                // user_Info={userInfo}
              />
            </>
          ) : (
            <div className="text-center p-5">
              <Card style={{
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: '16px'
              }}>
                <Card.Body className="py-5">
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>No subcodes assigned.</p>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ExaminerValuation;
