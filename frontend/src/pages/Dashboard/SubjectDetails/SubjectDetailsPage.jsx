import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import SubjectDataTable from '../../../components/SubjectDataTable/SubjectDataTable';

/**
 * SubjectDetailsPage Component
 * Displays subject information in a data table
 * Fetches data from user's subject assignments
 */
const SubjectDetailsPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [subjectData, setSubjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userInfo) {
      fetchSubjectData();
    }
  }, [userInfo]);

  const fetchSubjectData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the request body from userInfo
      const requestBody = {
        department: userInfo.department || '',
        role: userInfo.Role || '',
        subcode: userInfo.subcode || '',
        Chief_subcode: userInfo.Chief_subcode || '',
        chief_examiner: userInfo.chief_examiner || '',
        Eva_Subject: userInfo.Eva_Subject || '',
        Chief_Eva_Subjects: userInfo.Chief_Eva_Subjects || '',
        Max_Papers_subject: userInfo.Max_Papers_subject || '',
        Sub_Max_Papers: userInfo.Sub_Max_Papers || '',
        Camp_id: userInfo.Camp_id || '',
        camp_offcer_id_examiner: userInfo.camp_offcer_id_examiner || '',
        Chief_Valuation_Status: userInfo.Chief_Valuation_Status || '',
        Camp_id_chief: userInfo.Camp_id_chief || '',
        camp_offcer_id_chief: userInfo.camp_offcer_id_chief || '',
      };

      // Fetch data from API
      const response = await fetch('/api/dashboard/subcode-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subject data');
      }

      const data = await response.json();
      
      // Combine regular subjects and chief subjects
      const allSubjects = [
        ...(data.subcode_subjects || []),
        ...(data.chief_subcode_subjects || []).map(chief => ({
          sub_code: chief.chief_sub_code,
          sub_name: chief.chief_sub_name,
          department: chief.Camp_id_chief?.substring(0, 2) || '-', // Extract dept from camp ID
          Camp_id: chief.Camp_id_chief,
          camp_offcer_id_examiner: chief.camp_offcer_id_chief,
          Sub_Max_Papers: '0', // Chief subjects typically don't have max papers
          role: 'Chief Examiner',
        })),
      ];

      setSubjectData(allSubjects);
    } catch (err) {
      console.error('Error fetching subject data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Subject Details</h2>
          <p className="text-muted">
            View all assigned subjects with department, camp, and officer information
          </p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <SubjectDataTable 
            data={subjectData} 
            isLoading={isLoading}
            title="Subject Information"
          />
        </Col>
      </Row>
    </Container>
  );
};

export default SubjectDetailsPage;
