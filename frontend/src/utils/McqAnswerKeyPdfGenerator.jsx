import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from '@react-pdf/renderer';
import logoImage from '../assets/SRMCLEARLOGO.png';
import {useMcqMasterDataBySubcodeQuery} from '../redux-slice/mcqOperationSlice';

// Register multiple fonts for comprehensive Unicode support
// Note: @react-pdf/renderer doesn't support automatic fallback, so we use a comprehensive base font

// Base Latin, Cyrillic, Greek, symbols
Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: new URL('../assets/fonts/NotoSans-Regular.ttf', import.meta.url).href,
      fontWeight: 400,
    },
    {
      src: new URL('../assets/fonts/NotoSans-Bold.ttf', import.meta.url).href,
      fontWeight: 700,
    },
  ],
});

// Hindi/Devanagari script
Font.register({
  family: 'NotoSansDevanagari',
  fonts: [
    {
      src: new URL('../assets/fonts/NotoSansDevanagari-Regular.ttf', import.meta.url).href,
      fontWeight: 400,
    },
  ],
});

// CJK (Chinese, Japanese, Korean) - includes Latin as well
Font.register({
  family: 'NotoSansCJK',
  fonts: [
    {
      src: new URL('../assets/fonts/NotoSansCJK-Regular.ttc', import.meta.url).href,
      fontWeight: 400,
    },
    {
      src: new URL('../assets/fonts/NotoSansCJK-Bold.ttc', import.meta.url).href,
      fontWeight: 700,
    },
  ],
});

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 9,
    fontFamily: 'NotoSansCJK',
  },
  header: {
    marginBottom: 15,
    borderBottom: '1.5px solid #000000',
    paddingBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  institutionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  institutionSubtitle: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  institutionAddress: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a6e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#2a5298',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
  },
  infoLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  infoRight: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#000000',
  },
  infoValue: {
    color: '#000000',
    marginLeft: 5,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
    paddingHorizontal: 6,
    minHeight: 22,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
    paddingHorizontal: 6,
    minHeight: 22,
  },
  tableColHeader: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#000000',
    textAlign: 'center',
  },
  tableCol: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
  },
  colQstNum: {
    width: '12%',
  },
  colAnswer: {
    width: '28%',
  },
  colRemarks: {
    width: '60%',
    textAlign: 'left',
    paddingLeft: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6c757d',
    borderTop: '1px solid #dee2e6',
    paddingTop: 10,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 8,
    color: '#000000',
  },
  watermark: {
    position: 'absolute',
    fontSize: 60,
    color: '#e9ecef',
    transform: 'rotate(-45deg)',
    top: '40%',
    left: '25%',
    opacity: 0.1,
  },
});

// Helper function to detect script and return appropriate font family
const detectFontFamily = (text) => {
  if (!text) return 'NotoSansCJK';
  
  const str = String(text);
  
  // Check for CJK characters (Chinese, Japanese, Korean)
  const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(str);
  if (hasCJK) return 'NotoSansCJK';
  
  // Check for Devanagari (Hindi)
  const hasDevanagari = /[\u0900-\u097F]/.test(str);
  if (hasDevanagari) return 'NotoSansDevanagari';
  
  // Default to CJK font as it includes Latin characters and has good coverage
  return 'NotoSansCJK';
};

// Smart Text component that automatically selects the right font
const SmartText = ({ children, style }) => {
  const fontFamily = detectFontFamily(children);
  return <Text style={[style, { fontFamily }]}>{children}</Text>;
};

// PDF Document Component
const McqAnswerKeyDocument = ({ data, masterData }) => {
  // Sort data by question number
  const sortedData = [...data].sort((a, b) => a.Qst_Number - b.Qst_Number);
  
  // Get metadata from first record
  const metadata = data[0] || {};

  // Create lookup function to get ans_Des from ans_Mas
  const getAnswerDescription = (answerCode) => {
    if (!masterData || !Array.isArray(masterData)) return answerCode || '-';
    const found = masterData.find(item => item.ans_Mas === answerCode);
    return found ? found.ans_Des : (answerCode || '-');
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>ANSWER KEY</Text>
        
        {/* Header Section with Logo and Institution Details */}
        <View style={styles.header}>
          {/* Logo and Institution Name */}
          <View style={styles.logoContainer}>
            <Image src={logoImage} style={styles.logo} />
          </View>
          <Text style={styles.institutionTitle}>SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</Text>
          <Text style={styles.institutionSubtitle}>(Deemed to be University u/s 3 of UGC Act, 1956)</Text>
          <Text style={styles.institutionAddress}>S.R.M.Nagar, Kattankulathur - 603 203</Text>
        </View>

        {/* Information Section */}
        <View style={{ marginBottom: 12 }}>
          {/* Row 1: Eva Name and Month & Year */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Eva Name (Eva Id) :</Text>
              <Text style={styles.infoValue}>{metadata.Eva_Id || 'N/A'}</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>Month & Year :</Text>
              <Text style={styles.infoValue}>{metadata.Eva_Month ? metadata.Eva_Month.replace(/_/g, ' ') : 'N/A'}</Text>
            </View>
          </View>

          {/* Row 2: Subcode and No.Of.Question */}
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoLabel}>Subcode :</Text>
              <Text style={styles.infoValue}>{metadata.Subcode || 'N/A'}</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoLabel}>No.Of.Question :</Text>
              <Text style={styles.infoValue}>{data.length}</Text>
            </View>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.colQstNum]}>
              Q.no
            </Text>
            <Text style={[styles.tableColHeader, styles.colAnswer]}>
              Answer Key
            </Text>
            <Text style={[styles.tableColHeader, styles.colRemarks]}>
              Description Answer Key
            </Text>
          </View>

          {/* Table Rows */}
          {sortedData.map((item, index) => (

            <View 
              key={item.id || index} 
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCol, styles.colQstNum]}>
                {item.Qst_Number}
              </Text>
              <SmartText style={[styles.tableCol, styles.colAnswer]}>
                {getAnswerDescription(item.Qst_Ans)}
              </SmartText>
              <SmartText style={[styles.tableCol, styles.colRemarks]}>
                {item.Qst_Remarks || '-'}
              </SmartText>
            </View>
          ))}
        </View>

        {/* Footer */}
        
      </Page>
    </Document>
  );
};

// Main Export Component - Download Button with open in new tab
export const McqAnswerKeyPdfDownload = ({ data, subcode, filename }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch master data for answer key descriptions
  const { data: masterDataResponse } = useMcqMasterDataBySubcodeQuery();
  const masterData = masterDataResponse?.data || [];

  if (!data || data.length === 0) {
    return (
      <button 
        disabled 
        style={{ 
          padding: '8px 16px', 
          background: '#ccc', 
          border: 'none', 
          borderRadius: '6px',
          cursor: 'not-allowed',
          fontSize: '0.9rem'
        }}
      >
        No Data Available
      </button>
    );
  }

  const pdfFilename = filename || `MCQ_AnswerKey_${subcode || 'Subject'}_${Date.now()}.pdf`;

  const handleDownloadAndOpen = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Generate PDF blob
      const blob = await pdf(<McqAnswerKeyDocument data={data} masterData={masterData} />).toBlob();
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in new tab first (before download to prevent popup blockers)
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        // Set the blob URL to the new window
        newWindow.location.href = blobUrl;
      } else {
        // If popup was blocked, still download
        console.warn('Popup blocked. PDF will be downloaded only.');
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdfFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL after a delay (give time for download and opening)
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAndOpen}
      disabled={isGenerating}
      className="btn btn-sm"
      style={{
        padding: '4px 12px',
        background: isGenerating ? '#6c757d' : '#0d6efd',
        color: '#fff',
        borderRadius: '4px',
        border: 'none',
        fontWeight: '500',
        fontSize: '0.8rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        minWidth: '72px',
        whiteSpace: 'nowrap',
        opacity: isGenerating ? 0.65 : 1
      }}
      onMouseEnter={(e) => {
        if (!isGenerating) {
          e.target.style.background = '#0b5ed7';
        }
      }}
      onMouseLeave={(e) => {
        if (!isGenerating) {
          e.target.style.background = '#0d6efd';
        }
      }}
    >
      {isGenerating ? 'Loading...' : 'PDF'}
    </button>
  );
};

// Alternative: Generate and open PDF in new tab
export const McqAnswerKeyPdfViewer = ({ data }) => {
  // Fetch master data for answer key descriptions
  const { data: masterDataResponse } = useMcqMasterDataBySubcodeQuery();
  const masterData = masterDataResponse?.data || [];
  
  return <McqAnswerKeyDocument data={data} masterData={masterData} />;
};

export default McqAnswerKeyPdfDownload;
