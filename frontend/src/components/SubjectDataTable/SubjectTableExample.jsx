import React, { useMemo, useState, useEffect } from 'react';
import SubjectDataTable from './SubjectDataTable';
// import ChiefSubjectDataTable from './ChiefSubjectDataTable';
import { useDeleteSubjectDataMutation } from '../../redux-slice/adminOperationApiSlice';
import { toast } from 'react-toastify';

/**
 * Example usage of SubjectDataTable with sample data
 * This can be integrated into any page or component
 */
const SubjectTableExample = ({ currentRow , selectedRole }) => {
  
  // Parse the data with proper null/undefined checks
  let Dep_Name_Field =`Dep_Name_${selectedRole}`;

  const [deleteSubjectData, { isLoading: isDeleting }] = useDeleteSubjectDataMutation();
  const [localSubjects, setLocalSubjects] = useState([]);

  const sampleSubjects = useMemo(() => {
    if (!currentRow) return [];
    
if (selectedRole === '2') {
    const SubjectCode = currentRow.subcode ? currentRow.subcode.split(',') : [];
    const SubjectName = currentRow.sub_name ? currentRow.sub_name.split(',') : [];
    const Department = currentRow[Dep_Name_Field] ? currentRow[Dep_Name_Field].split(',') : [];
    const CampId = currentRow.Camp_id ? currentRow.Camp_id.split(',') : [];
    const CampOfficerId = currentRow.camp_offcer_id_examiner ? currentRow.camp_offcer_id_examiner.split(',') : [];
    const MaxPapers = currentRow.Sub_Max_Paper ? currentRow.Sub_Max_Paper.split(',') : [];
    const Examiner_Status = currentRow.Examiner_Valuation_Status ? currentRow.Examiner_Valuation_Status.split(',') : [];
    const Eva_Subjects = currentRow.Eva_Subject ? currentRow.Eva_Subject.split(',') : [];
   // const Examiner_Id = currentRow.id ? currentRow.id.split(',') : [];

    if (SubjectCode.length === 0) return [];
    
    return SubjectCode.map((code, index) => ({
      sub_code: code.trim(),
      sub_name: SubjectName[index] ? SubjectName[index].trim() : '',
      department: Department[index] ? Department[index].trim() : '',
      Camp_id: CampId[index] ? CampId[index].trim() : '',
      camp_offcer_id_examiner: CampOfficerId[index] ? CampOfficerId[index].trim() : '',
      Sub_Max_Papers: MaxPapers[index] ? MaxPapers[index].trim() : '0',
      Examiner_Valuation_Status: Examiner_Status[index] ? Examiner_Status[index].trim() : '',
      Eva_Subject: Eva_Subjects[index] ? Eva_Subjects[index].trim() : '',
      Recordid: currentRow.id ,
      Eva_Id: currentRow.Eva_Id,
      id: index
    }));
  } else if (selectedRole === '1') {
    const SubjectCode = currentRow.Chief_subcode ? currentRow.Chief_subcode.split(',') : [];
    const SubjectName = currentRow.Chief_sub_name ? currentRow.Chief_sub_name.split(',') : [];
    const Department = currentRow[Dep_Name_Field] ? currentRow[Dep_Name_Field].split(',') : [];
    const CampId = currentRow.Camp_id_chief ? currentRow.Camp_id_chief.split(',') : [];
    const CampOfficerId = currentRow.camp_offcer_id_chief ? currentRow.camp_offcer_id_chief.split(',') : [];
    const chief_examiner = currentRow.chief_examiner ? currentRow.chief_examiner.split(',') : [];
    const MaxPapers = currentRow.Chief_Sub_Max_Paper ? currentRow.Chief_Sub_Max_Paper.split(',') : [];
    const Examiner_Status = currentRow.Chief_Valuation_Status ? currentRow.Chief_Valuation_Status.split(',') : [];
    const Eva_Subjects = currentRow.Chief_Eva_Subject ? currentRow.Chief_Eva_Subject.split(',') : [];
   // const Examiner_Id = currentRow.id ? currentRow.id.split(',') : [];

    if (SubjectCode.length === 0) return [];
    
    return SubjectCode.map((code, index) => ({
      sub_code: code.trim(),
      sub_name: SubjectName[index] ? SubjectName[index].trim() : '',
      department: Department[index] ? Department[index].trim() : '',
      Camp_id: CampId[index] ? CampId[index].trim() : '',
      camp_offcer_id_examiner: CampOfficerId[index] ? CampOfficerId[index].trim() : '',
      Sub_Max_Papers: MaxPapers[index] ? MaxPapers[index].trim() : '0',
      chief_examiner: chief_examiner[index] ? chief_examiner[index].trim() : '',
      Examiner_Valuation_Status: Examiner_Status[index] ? Examiner_Status[index].trim() : '',
      Eva_Subject: Eva_Subjects[index] ? Eva_Subjects[index].trim() : '',
      Recordid: currentRow.id ,
      Eva_Id: currentRow.Eva_Id,
      id: index
    }));
  }
  }, [currentRow]);

  // Sync local state whenever sampleSubjects changes (e.g. currentRow switches)
  useEffect(() => {
    setLocalSubjects(sampleSubjects || []);
  }, [sampleSubjects]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete subject ${row.sub_code} for ${row.Eva_Id}?`)) return;
    try {
      await deleteSubjectData({
        id: row.id,           // index position in comma-separated arrays
        Eva_Id: row.Eva_Id,
        Subject_Code: row.sub_code,
        Evaluation_Type: row.Eva_Subject,
        selectedRole,
      }).unwrap();
      // Remove the row from local display immediately
      setLocalSubjects((prev) => prev.filter((_, i) => i !== row.id));
      toast.success(`Subject ${row.sub_code} deleted successfully`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err?.data?.message || 'Failed to delete subject');
    }
  };

  const handleDeleteChief = async (row) => {
    if (!window.confirm(`Delete subject ${row.sub_code} for ${row.Eva_Id}?`)) return;
    try {
      await deleteSubjectData({
        id: row.id,           // index position in comma-separated arrays
        Eva_Id: row.Eva_Id,
        Subject_Code: row.sub_code,
        Evaluation_Type: row.Eva_Subject,
        chief_examiner: row.chief_examiner,
        selectedRole,
      }).unwrap();
      // Remove the row from local display immediately
      setLocalSubjects((prev) => prev.filter((_, i) => i !== row.id));
      toast.success(`Subject ${row.sub_code} deleted successfully`);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err?.data?.message || 'Failed to delete subject');
    }
  }

  return (
    <div>
      {selectedRole === '2' ? (
      <SubjectDataTable 
        data={localSubjects}
        isLoading={isDeleting}
        title="Subject Information Table"
        evaId={currentRow?.Eva_Id}
        selectedRole={selectedRole}
        onDelete={handleDelete}
      />
      ) : selectedRole === '1' ? (
        <SubjectDataTable 
          data={localSubjects}
          isLoading={isDeleting}
          title="Chief Subject Information Table"
          evaId={currentRow?.Eva_Id}
          selectedRole={selectedRole}
          onDelete={handleDeleteChief}
        />
      ) : null}
    </div>
  );
};

export default SubjectTableExample;

/**
 * ====================================
 * INTEGRATION EXAMPLES
 * ====================================
 */

// Example 1: Using with Redux state
/*
import { useSelector } from 'react-redux';

const MyComponent = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // Parse user's subject data
  const subjectData = useMemo(() => {
    if (!userInfo?.subcode) return [];
    
    const subcodes = userInfo.subcode.split(',');
    const departments = userInfo.department?.split(',') || [];
    const campIds = userInfo.Camp_id?.split(',') || [];
    const campOfficers = userInfo.camp_offcer_id_examiner?.split(',') || [];
    const maxPapers = userInfo.Sub_Max_Papers?.split(',') || [];
    
    return subcodes.map((code, index) => ({
      sub_code: code,
      sub_name: 'Subject Name', // Fetch from sub_master
      department: departments[index] || '-',
      Camp_id: campIds[index] || '-',
      camp_offcer_id_examiner: campOfficers[index] || '-',
      Sub_Max_Papers: maxPapers[index] || '0',
    }));
  }, [userInfo]);
  
  return <SubjectDataTable data={subjectData} />;
};
*/

// Example 2: Using with API call
/*
import { useGetSubjectDataQuery } from '../../../redux-slice/SubjectMasterApiSlice';

const MyComponent = () => {
  const { data: apiData, isLoading, error } = useGetSubjectDataQuery();
  
  const subjectData = useMemo(() => {
    if (!apiData?.data) return [];
    return apiData.data.map(subject => ({
      sub_code: subject.Subcode,
      sub_name: subject.SUBNAME,
      department: subject.Dep_Name,
      Camp_id: subject.Camp_id || '-',
      camp_offcer_id_examiner: subject.camp_offcer_id || '-',
      Sub_Max_Papers: subject.Max_Papers || '0',
    }));
  }, [apiData]);
  
  return <SubjectDataTable data={subjectData} isLoading={isLoading} />;
};
*/

// Example 3: Using with dashboard data
/*
import { useSelector } from 'react-redux';

const MyComponent = () => {
  const dashboardData = useSelector((state) => state.dashboard);
  
  // If dashboard already has subject_subjects array
  const subjectData = dashboardData?.subcode_subjects || [];
  
  return <SubjectDataTable data={subjectData} />;
};
*/
