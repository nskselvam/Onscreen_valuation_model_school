import React from 'react';
import { Card } from 'react-bootstrap';

/**
 * Preview component to show what the PDF will look like
 * This displays the data in browser before generating PDF
 */
const McqAnswerKeyPreview = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
        No data to preview
      </div>
    );
  }

  // Sort data by question number
  const sortedData = [...data].sort((a, b) => a.Qst_Number - b.Qst_Number);
  const metadata = data[0] || {};

  return (
    <Card style={{ maxWidth: '800px', margin: '20px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      {/* Header */}
      <Card.Header style={{ 
        background: 'linear-gradient(135deg, #1e3a6e, #2a5298)', 
        color: '#fff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>MCQ Answer Key</h4>
        <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem' }}>{metadata.SubName || 'Subject Name'}</p>
      </Card.Header>

      <Card.Body style={{ padding: '20px' }}>
        {/* Metadata Section */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
            <div>
              <strong style={{ color: '#495057' }}>Subject Code:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{metadata.Subcode || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Department:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{metadata.Dep_Name || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Evaluator ID:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{metadata.Eva_Id || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Evaluation Month:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{metadata.Eva_Month || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Upload Date:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{metadata.Upload_Date || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>Total Questions:</strong>
              <span style={{ marginLeft: '8px', color: '#212529' }}>{data.length}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid #dee2e6',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #2a5298' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  color: '#495057',
                  width: '15%'
                }}>
                  Question No.
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  color: '#495057',
                  width: '15%'
                }}>
                  Answer
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#495057',
                  width: '70%'
                }}>
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr 
                  key={item.id || index}
                  style={{ 
                    background: index % 2 === 0 ? '#fff' : '#f8f9fa',
                    borderBottom: '1px solid #e9ecef'
                  }}
                >
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center',
                    color: '#212529',
                    fontWeight: '500'
                  }}>
                    {item.Qst_Number}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center',
                    color: '#212529',
                    fontWeight: '500'
                  }}>
                    {item.Qst_Ans || '-'}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'left',
                    color: '#495057'
                  }}>
                    {item.Qst_Remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '15px', 
          borderTop: '1px solid #dee2e6',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#6c757d'
        }}>
          Generated on {new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true 
          })} | MCQ Answer Key System
        </div>
      </Card.Body>
    </Card>
  );
};

export default McqAnswerKeyPreview;
