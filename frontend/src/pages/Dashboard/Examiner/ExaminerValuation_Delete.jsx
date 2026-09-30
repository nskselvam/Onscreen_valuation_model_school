import React, { useEffect } from 'react'
import UploadPageLayout from "../../../components/DashboardComponents/UploadPageLayout"
import { data, useNavigate } from 'react-router-dom'
import { Button, Card, Col, Row, Dropdown, DropdownButton } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentSubCode } from '../../../redux-slice/valuationSlice'
import {useGetValuationfetchDataQuery} from '../../../redux-slice/userDashboardSlice'


const ExaminerValuation = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const userInfo = useSelector((state) => state.auth.userInfo)
  const dataFromSubcode = userInfo.subcode;
  const dataSubcodeArray = dataFromSubcode ? dataFromSubcode.split(',') : [];

  const LoginUserRole = userInfo.selected_role;

  const basic_info_data = {
    "department": userInfo.department,
    "role": userInfo.role,
    "subcode": userInfo.subcode,
    "Eva_Subject": userInfo.Eva_Subject,
    "Max_Papers_subject": userInfo.Max_Papers_subject,
    "Sub_Max_Papers": userInfo.Sub_Max_Papers,
    "chief_examiner": userInfo.chief_examiner,
    "Chief_subcode": userInfo.Chief_subcode,
    "Chief_Eva_Subjects": userInfo.Chief_Eva_Subjects,
    "Camp_id": userInfo.Camp_id,
    "camp_offcer_id_examiner": userInfo.camp_offcer_id_examiner,
    "Camp_id_chief": userInfo.Camp_id_chief,
    "camp_offcer_id_chief": userInfo.camp_offcer_id_chief,
    "Examiner_Valuation_Status": userInfo.Examiner_Valuation_Status,
    "Chief_Valuation_Status": userInfo.Chief_Valuation_Status
  }

  const { data: dataFromSubcodeTest, error, isLoading } = useGetValuationfetchDataQuery(basic_info_data);

  useEffect(() => {
    if (error) {
      console.error("Error fetching valuation data: ", error);
    }
  }, [error])

  


  // Dynamic color variants for cards
  const cardColors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary', 'dark'];
  
  const getCardColor = (index) => {
    return cardColors[index % cardColors.length];
  };

  const handleSubcodeClick = (sub_code, type) => {
    dispatch(setCurrentSubCode(sub_code))
    navigate('/valuation', { state: { subCode: sub_code, type: type } })
  }


  return (
    <UploadPageLayout
      mainTopic="Examiner Valuation"
      subTopic="Manage and review examiner valuations"
      cardTitle='Valuation Details'
    >

      <Row className="g-3">
        {dataFromSubcodeTest?.subcode_subjects && dataFromSubcodeTest.subcode_subjects.length > 0  && LoginUserRole == 2 ? (
          dataFromSubcodeTest.subcode_subjects.map((item, index) => (
            <Col xs={12} md={6} key={item.sub_code}>
              <Card 
                className="h-100 shadow-sm"
                bg={getCardColor(index)}
                text={getCardColor(index) === 'warning' ? 'dark' : 'white'}
              >
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-1">
                    <h5>{item.sub_code}  - {item.sub_name}</h5>
                  </Card.Title>
                  <DropdownButton 
                    id={`dropdown-${item.sub_code}`}
                    title="Select Action"
                    variant="light"
                    className="mt-auto"
                    onClick={(e) => e.stopPropagation()}
                    >
                    <Dropdown.Item 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubcodeClick(item.sub_code, 'evaluation');
                      }}
                      className="bg-dark text-white"
                      style={{ fontWeight: '500' }}
                      >
                      📝 Evaluation
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubcodeClick(item.sub_code, 'review');
                      }}
                      className="bg-dark text-white"
                      style={{ fontWeight: '500' }}
                      >
                      🔍 Review
                    </Dropdown.Item>
                  </DropdownButton>
                      <Card.Text className="mt-3 mb-0">
                        Select an option to proceed with this subject code
                      </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (dataFromSubcodeTest?.chief_subcode_subjects && dataFromSubcodeTest.chief_subcode_subjects.length > 0 && LoginUserRole == 7 ) ? (

                  dataFromSubcodeTest.chief_subcode_subjects.map((item, index) => (
            <Col xs={12} md={6} key={item.chief_sub_code}>
              <Card 
                className="h-100 shadow-sm"
                bg={getCardColor(index)}
                text={getCardColor(index) === 'warning' ? 'dark' : 'white'}
              >
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-1">
                    <h5>{item.chief_sub_code}  - {item.chief_sub_name}</h5>
                  </Card.Title>
                  <DropdownButton 
                    id={`dropdown-${item.chief_sub_code}`}
                    title="Select Action"
                    variant="light"
                    className="mt-auto"
                    onClick={(e) => e.stopPropagation()}
                    >
                    <Dropdown.Item 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubcodeClick(item.chief_sub_code, 'evaluation');
                      }}
                      className="bg-dark text-white"
                      style={{ fontWeight: '500' }}
                      >
                      📝 Evaluation
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubcodeClick(item.chief_sub_code, 'review');
                      }}
                      className="bg-dark text-white"
                      style={{ fontWeight: '500' }}
                      >
                      🔍 Review
                    </Dropdown.Item>
                  </DropdownButton>
                      <Card.Text className="mt-3 mb-0">
                        Select an option to proceed with this subject code
                      </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))

        ) : (
          <Col xs={12}>
            <Card className="text-center p-4">
              <Card.Body>
                <p className="text-muted">No subcodes assigned.</p>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </UploadPageLayout>
  )
}

export default ExaminerValuation
