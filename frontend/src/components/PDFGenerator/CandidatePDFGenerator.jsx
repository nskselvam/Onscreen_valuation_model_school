import jsPDF from 'jspdf';
import { toast } from 'react-toastify';

// Helper functions for mapping codes to names
const getCommunityName = (code) => {
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
  return communityMap[code] || code;
};

const getGenderName = (code) => {
  const genderMap = {
    0: 'Others',
    1: 'Male',
    2: 'Female'
  };
  return genderMap[code] || code;
};

const getPSTMName = (code) => {
  const pstmMap = {
    0: 'Others',
    1: 'Tamil',
    2: 'English'
  };
  return pstmMap[code] || code;
};

// Generate PDF for a single candidate (Portrait A4)
export const generateCandidatePDF = (row) => {
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
    1: 'Present', 
    3: 'Not Willing',
    2: 'Not Eligible',
    4: 'Absent' 
  };
                

  const statusText = statusMap[row.candidate_status] || 'Not Processed';

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
  
  // School Name
  doc.setFont('helvetica', 'bold');
  doc.text('School:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  const schoolText = row.school_name || '';
  const schoolLines = doc.splitTextToSize(schoolText, contentWidth - 70);
  doc.text(schoolLines, margin + 60, yPos);
  yPos += (schoolLines.length * 6) + 12;
  
  // Candidate Status
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate Status:', margin + 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(statusText, margin + 60, yPos);
  yPos += 15;
  
  // Candidate Preferences (only if Present)
  if (row.candidate_status === 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Preferences:', margin + 10, yPos);
    doc.setFont('helvetica', 'normal');
    const prefLines = doc.splitTextToSize(preferencesText, contentWidth - 70);
    doc.text(prefLines, margin + 60, yPos);
  }
  
  // Signature Section
  yPos = 240; // Fixed position for signatures
  
  // Draw signature lines
  doc.setLineWidth(0.3);
  
  // Candidate Signature (left side)
  const leftLineStart = margin + 10;
  const leftLineEnd = margin + 70;
  const leftCenter = leftLineStart + (leftLineEnd - leftLineStart) / 2;
  doc.line(leftLineStart, yPos - 10, leftLineEnd, yPos - 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Candidate Signature', leftCenter, yPos, { align: 'center' });
  
  // Head Master Signature (right side)
  const rightLineStart = pageWidth - margin - 70;
  const rightLineEnd = pageWidth - margin - 10;
  const rightCenter = rightLineStart + (rightLineEnd - rightLineStart) / 2;
  doc.line(rightLineStart, yPos - 10, rightLineEnd, yPos - 10);
  doc.text('Head Master Signature', rightCenter, yPos, { align: 'center' });

  const filename = `Candidate_${row.Emis_No}_${row.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
  toast.success(`PDF generated for ${row.name}!`);
};

export default { generateCandidatePDF };
