import React from 'react';
import { Container } from 'react-bootstrap';
import SubjectTableExample from '../../../components/SubjectDataTable/SubjectTableExample';

/**
 * Quick Demo Page for Subject Data Table
 * Access this page to see the table in action
 */
const SubjectTableDemo = () => {
  return (
    <Container fluid className="p-4" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div className="mb-4">
        <h2 className="mb-2">Subject Data Table Demo</h2>
        <p className="text-muted">
          This page demonstrates the Subject Data Table component with sample data.
        </p>
        <div className="alert alert-info">
          <strong>Displayed Fields:</strong>
          <ul className="mb-0 mt-2">
            <li>Subject Code</li>
            <li>Subject Name</li>
            <li>Department Name</li>
            <li>Camp ID</li>
            <li>Camp Officer ID</li>
            <li>Total Papers in Each Subject</li>
          </ul>
        </div>
      </div>
      
      <SubjectTableExample />
      
      <div className="mt-4 p-3 bg-white rounded shadow-sm">
        <h5>Integration Notes:</h5>
        <ul>
          <li>The table includes search functionality across all fields</li>
          <li>Click column headers to sort data</li>
          <li>Pagination controls at the bottom</li>
          <li>Responsive design adapts to screen size</li>
          <li>See <code>SubjectDataTable/README.md</code> for full documentation</li>
        </ul>
      </div>
    </Container>
  );
};

export default SubjectTableDemo;
