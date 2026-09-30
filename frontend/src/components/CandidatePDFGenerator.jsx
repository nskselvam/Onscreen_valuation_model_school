import jsPDF from 'jspdf';

// Community mapping
const communityMap = {
  0: 'Others',
  1: 'SC',
  2: 'ST',
  3: 'MBC',
  4: 'BC',
  5: 'OC',
  6: 'SCA',
  7: 'BCM'
};

const getCommunityName = (code) => {
  return communityMap[code] || code;
};

// Gender mapping
const genderMap = {
  0: 'Others',
  1: 'Male',
  2: 'Female'
};

const getGenderName = (code) => {
  return genderMap[code] || code;
};

// PSTM (Medium) mapping
const pstmMap = {
  0: 'Others',
  1: 'Tamil',
  2: 'English'
};

const getPSTMName = (code) => {
  return pstmMap[code] || code;
};

// School Type mapping
const schoolTypeMap = {
  1: 'Model School',
  2: 'Government School'
};

const getSchoolTypeName = (code) => {
  return schoolTypeMap[code] || 'Unknown';
};

/**
 * Generate PDF for a single candidate (Portrait A4)
 * @param {Object} row - Student record data
 */
export const generateSingleCandidatePDF = (row) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210; // A4 portrait width
  const pageHeight = 297; // A4 portrait height
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Preference mapping
  const preferenceMap = { 0: 'Not Selected', 1: 'JEE', 2: 'NEET' };

  // Get candidate preferences from comma-separated string
  let preferencesText = 'Not Selected';
  if (row.candidate_preferences) {
    const prefs = row.candidate_preferences
      .split(',')
      .map(p => p.trim())
      .filter(p => p)
      .map(code => preferenceMap[code] || code);
    if (prefs.length > 0) {
      preferencesText = prefs.map((pref, index) => `${index + 1}. ${pref}`).join(', ');
    }
  }

  // Get candidate status
  const statusMap = { 
    0: 'Not Processed',
    1: 'Present', 
    2: 'Not Willing', 
    3: 'Not Eligible', 
    4: 'Absent' 
  };
  const statusText = statusMap[row.candidate_status] || 'Not Selected';

  let yPos = 25;
  
  // Title/Heading
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE INFORMATION', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Draw outer border
  doc.setLineWidth(0.8);
  doc.rect(margin, yPos - 5, contentWidth, 200);
  
  yPos += 10;
  
  // Content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // EMIS No
  doc.setFont('helvetica', 'bold');
  doc.text('EMIS No:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(row.Emis_No || '', margin + 60, yPos);
  yPos += 12;
  
  // Student Name
  doc.setFont('helvetica', 'bold');
  doc.text('Student Name:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(row.name || '', margin + 60, yPos);
  yPos += 12;
  
  // Father Name
  doc.setFont('helvetica', 'bold');
  doc.text('Father Name:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(row.father_name || '', margin + 60, yPos);
  yPos += 12;
  
  // DOB
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Birth:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(row.dob || '', margin + 60, yPos);
  yPos += 12;
  
  // Community
  doc.setFont('helvetica', 'bold');
  doc.text('Community:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getCommunityName(row.com), margin + 60, yPos);
  yPos += 12;
  
  // Gender
  doc.setFont('helvetica', 'bold');
  doc.text('Gender:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(getGenderName(row.sex), margin + 60, yPos);
  yPos += 12;
  
  // School
  doc.setFont('helvetica', 'bold');
  doc.text('School:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  const schoolText = doc.splitTextToSize(row.school_name || '', contentWidth - 60);
  doc.text(schoolText, margin + 60, yPos);
  yPos += 12 * Math.max(1, schoolText.length);
  
  // District
  if (row.district_name) {
    doc.setFont('helvetica', 'bold');
    doc.text('District:', margin + 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(row.district_name || '', margin + 60, yPos);
    yPos += 12;
  }
  
  // School Type
  if (row.Student_Status) {
    doc.setFont('helvetica', 'bold');
    doc.text('School Type:', margin + 10, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(getSchoolTypeName(row.Student_Status), margin + 60, yPos);
    yPos += 12;
  }
  
  // Candidate Status
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate Status:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(statusText, margin + 60, yPos);
  yPos += 12;
  
  // Preferences (only show if Present)
  if (row.candidate_status === 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Preferences:', margin + 10, yPos);
    doc.setFont('helvetica', 'normal');
    const prefText = doc.splitTextToSize(preferencesText, contentWidth - 60);
    doc.text(prefText, margin + 60, yPos);
    yPos += 12 * Math.max(1, prefText.length);
  }
  
  // Signature placeholders at bottom
  yPos = 240;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Candidate Signature', margin + 20, yPos, { align: 'center' });
  doc.text('Head Master Signature', pageWidth - margin - 20, yPos, { align: 'center' });
  
  // Download PDF
  const fileName = `Candidate_${row.Emis_No || 'Unknown'}_${row.name?.replace(/\s+/g, '_') || 'ABINAYA_R'}.pdf`;
  doc.save(fileName);
};

export default { generateSingleCandidatePDF };
