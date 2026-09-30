import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Tabs, Tab, Badge, Spinner, InputGroup, Pagination, Offcanvas } from 'react-bootstrap';
import { FaPlay, FaHistory, FaDatabase, FaTable, FaTrash, FaCopy, FaDownload, FaSearch, FaCode, FaSortUp, FaSortDown, FaSort, FaListAlt, FaPlus, FaEdit, FaChartBar, FaInfoCircle, FaLink, FaTimes } from 'react-icons/fa';
import { useGetTablesQuery, useExecuteQueryMutation } from '../../redux-slice/adminSqlApiSlice';
import './AdminWindowsql.css';

const AdminWindowsql = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('query');
  const [executionTime, setExecutionTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // RTK Query hooks
  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useGetTablesQuery();
  const [executeQueryMutation, { isLoading: queryLoading }] = useExecuteQueryMutation();

  const tables = tablesData?.tables || [];

  // Debug logging
  useEffect(() => {
  }, [tablesData, tablesLoading, tablesError, tables]);

  // Load query history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sqlQueryHistory');
    if (savedHistory) {
      setQueryHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Execute SQL query
  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setError(null);
    setResults(null);
    const startTime = performance.now();

    try {
      const response = await executeQueryMutation({ query }).unwrap();
      const endTime = performance.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(3));
      
      setResults(response);
      
      // Add to query history
      const newHistory = [
        {
          query,
          timestamp: new Date().toISOString(),
          success: true,
          rowCount: response.rows?.length || 0
        },
        ...queryHistory.slice(0, 19) // Keep only last 20 queries
      ];
      setQueryHistory(newHistory);
      localStorage.setItem('sqlQueryHistory', JSON.stringify(newHistory));
    } catch (err) {
      const endTime = performance.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(3));
      setError(err.data?.message || err.message || 'Query execution failed');
      
      // Add failed query to history
      const newHistory = [
        {
          query,
          timestamp: new Date().toISOString(),
          success: false,
          error: err.data?.message || err.message
        },
        ...queryHistory.slice(0, 19)
      ];
      setQueryHistory(newHistory);
      localStorage.setItem('sqlQueryHistory', JSON.stringify(newHistory));
    }
  };

  // Load table data
  const loadTableData = async (tableName) => {
    setSelectedTable(tableName);
    // Wrap table name in double quotes to preserve case in PostgreSQL
    setQuery(`SELECT * FROM "${tableName}" LIMIT 100;`);
    setActiveTab('query');
  };

  // Get table structure
  const getTableStructure = async (tableName) => {
    // Wrap table name in double quotes to preserve case in PostgreSQL
    setQuery(`SELECT column_name, data_type, character_maximum_length, is_nullable 
FROM information_schema.columns 
WHERE table_name = '${tableName}';`);
    setActiveTab('query');
  };

  // Common query templates with categories
  const queryTemplates = [
    {
      category: 'Basic Queries',
      icon: FaListAlt,
      color: '#0066b3',
      templates: [
        { 
          label: 'Select All Records', 
          icon: FaTable,
          description: 'Retrieve all columns and rows from a table',
          query: 'SELECT * FROM table_name LIMIT 100;' 
        },
        { 
          label: 'Count Total Rows', 
          icon: FaChartBar,
          description: 'Get the total number of rows in a table',
          query: 'SELECT COUNT(*) as total_rows FROM table_name;' 
        },
        { 
          label: 'Show All Tables', 
          icon: FaDatabase,
          description: 'List all tables in the current database',
          query: 'SHOW TABLES;' 
        },
        { 
          label: 'Describe Table Structure', 
          icon: FaInfoCircle,
          description: 'View column details and schema of a table',
          query: 'DESCRIBE table_name;' 
        },
      ]
    },
    {
      category: 'Data Manipulation',
      icon: FaEdit,
      color: '#28a745',
      templates: [
        { 
          label: 'Insert New Record', 
          icon: FaPlus,
          description: 'Add a new row to a table',
          query: 'INSERT INTO table_name (column1, column2, column3)\nVALUES (value1, value2, value3);' 
        },
        { 
          label: 'Update Records', 
          icon: FaEdit,
          description: 'Modify existing data in a table',
          query: 'UPDATE table_name\nSET column1 = value1,\n    column2 = value2\nWHERE condition;' 
        },
        { 
          label: 'Delete Records', 
          icon: FaTrash,
          description: 'Remove rows matching a condition',
          query: 'DELETE FROM table_name\nWHERE condition;' 
        },
        { 
          label: 'Bulk Insert', 
          icon: FaPlus,
          description: 'Insert multiple rows at once',
          query: 'INSERT INTO table_name (column1, column2)\nVALUES\n  (value1_1, value1_2),\n  (value2_1, value2_2),\n  (value3_1, value3_2);' 
        },
      ]
    },
    {
      category: 'Advanced Queries',
      icon: FaChartBar,
      color: '#6610f2',
      templates: [
        { 
          label: 'Inner Join Tables', 
          icon: FaLink,
          description: 'Join two tables on a common key',
          query: 'SELECT t1.*, t2.column_name\nFROM table1 t1\nINNER JOIN table2 t2\n  ON t1.id = t2.table1_id\nLIMIT 100;' 
        },
        { 
          label: 'Group By with Aggregate', 
          icon: FaChartBar,
          description: 'Group data and calculate aggregates',
          query: 'SELECT column1, \n       COUNT(*) as count,\n       AVG(column2) as average,\n       SUM(column3) as total\nFROM table_name\nGROUP BY column1\nORDER BY count DESC;' 
        },
        { 
          label: 'Conditional Select', 
          icon: FaSearch,
          description: 'Query with multiple conditions',
          query: 'SELECT *\nFROM table_name\nWHERE column1 = value1\n  AND column2 > value2\n  OR column3 IN (value3, value4)\nORDER BY column1 DESC\nLIMIT 100;' 
        },
        { 
          label: 'Left Join Tables', 
          icon: FaLink,
          description: 'Left join to include all records from left table',
          query: 'SELECT t1.*, t2.column_name\nFROM table1 t1\nLEFT JOIN table2 t2\n  ON t1.id = t2.table1_id\nWHERE t1.column1 IS NOT NULL\nLIMIT 100;' 
        },
      ]
    },
    {
      category: 'Database Administration',
      icon: FaDatabase,
      color: '#fd7e14',
      templates: [
        { 
          label: 'Show All Databases', 
          icon: FaDatabase,
          description: 'List all available databases/schemas',
          query: `SELECT schema_name\nFROM information_schema.schemata\nWHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')\nORDER BY schema_name;` 
        },
        { 
          label: 'Table Column Details', 
          icon: FaInfoCircle,
          description: 'Get detailed information about table columns',
          query: `SELECT \n  column_name as "Column",\n  data_type as "Type",\n  is_nullable as "Nullable",\n  column_default as "Default",\n  character_maximum_length as "Max Length"\nFROM information_schema.columns\nWHERE table_name = 'your_table'\nORDER BY ordinal_position;` 
        },
        { 
          label: 'Create New Table', 
          icon: FaPlus,
          description: 'Create a new table with schema',
          query: 'CREATE TABLE table_name (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);' 
        },
        { 
          label: 'Alter Table Structure', 
          icon: FaEdit,
          description: 'Modify existing table structure',
          query: 'ALTER TABLE table_name\nADD COLUMN new_column VARCHAR(255),\nMODIFY COLUMN existing_column INT,\nDROP COLUMN old_column;' 
        },
      ]
    },
  ];

  // Copy query to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (!results?.rows || results.rows.length === 0) return;

    const headers = Object.keys(results.rows[0]);
    const csvContent = [
      headers.join(','),
      ...results.rows.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().getTime()}.csv`;
    a.click();
  };

  // Clear query history
  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem('sqlQueryHistory');
  };

  // Filter and paginate results
  const getFilteredAndPaginatedData = () => {
    if (!results?.rows || results.rows.length === 0) return { paginatedData: [], totalPages: 0, filteredCount: 0 };

    // Filter data based on search term
    let filtered = results.rows.filter(row => {
      if (!searchTerm) return true;
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort data if sortColumn is set
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Handle null values
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
        if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
        
        // Handle different types
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        // Try numeric comparison first
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return { paginatedData, totalPages, filteredCount: filtered.length };
  };

  // Filter tables
  const filteredTables = tables.filter(table => 
    table.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  // Handle column sort
  const handleSort = (columnName) => {
    if (sortColumn === columnName) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(columnName);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get sort icon for column
  const getSortIcon = (columnName) => {
    if (sortColumn !== columnName) {
      return <FaSort className="ms-1" style={{ opacity: 0.3, cursor: 'pointer' }} />;
    }
    return sortDirection === 'asc' ? 
      <FaSortUp className="ms-1" style={{ cursor: 'pointer' }} /> : 
      <FaSortDown className="ms-1" style={{ cursor: 'pointer' }} />;
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const { paginatedData, totalPages, filteredCount } = getFilteredAndPaginatedData();

  return (
    <Container fluid className="admin-sql-container py-4">
      <Row>
        <Col>
          <h2 className="mb-4">
            <FaDatabase className="me-2" />
            SQL Admin Panel
          </h2>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        {/* Query Editor Tab */}
        <Tab eventKey="query" title={<><FaPlay className="me-2" />Query Editor</>}>
          <Row>
            <Col lg={12}>
              <Card className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>SQL Query Editor</span>
                  <div>
                    <Button 
                      variant="info" 
                      size="sm" 
                      onClick={() => setShowTemplates(true)}
                      className="me-2"
                    >
                      <FaCode /> Templates
                    </Button>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={executeQuery} 
                      disabled={queryLoading}
                      className="me-2"
                    >
                      {queryLoading ? <Spinner animation="border" size="sm" /> : <FaPlay />} Execute
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setQuery('')}
                    >
                      <FaTrash /> Clear
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="sql-editor"
                    style={{ fontFamily: 'monospace', fontSize: '14px' }}
                  />
                  <div className="mt-2">
                    <small className="text-muted">
                      Press Ctrl+Enter to execute query
                    </small>
                  </div>
                </Card.Body>
              </Card>

              {/* Results Section */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  <strong>Error:</strong> {error}
                </Alert>
              )}

              {results && (
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>
                      Query Results 
                      {results.rows && (
                        <>
                          <Badge bg="primary" className="ms-2">
                            {filteredCount} rows {searchTerm && `(filtered from ${results.rows.length})`}
                          </Badge>
                          {executionTime && (
                            <Badge bg="info" className="ms-2">
                              {executionTime}s
                            </Badge>
                          )}
                        </>
                      )}
                    </span>
                    <div className="d-flex gap-2">
                      {results.rows && results.rows.length > 0 && (
                        <>
                          <Button variant="outline-primary" size="sm" onClick={exportToCSV}>
                            <FaDownload /> Export CSV
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {results.message && (
                      <Alert variant="success">{results.message}</Alert>
                    )}
                    {results.rows && results.rows.length > 0 ? (
                      <>
                        {/* Search and pagination controls */}
                        <Row className="mb-3">
                          <Col md={6}>
                            <InputGroup size="sm">
                              <InputGroup.Text>
                                <FaSearch />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search in results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              {searchTerm && (
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => setSearchTerm('')}
                                >
                                  Clear
                                </Button>
                              )}
                            </InputGroup>
                          </Col>
                          <Col md={6} className="text-end">
                            <Form.Select 
                              size="sm" 
                              style={{ width: 'auto', display: 'inline-block' }}
                              value={rowsPerPage}
                              onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            >
                              <option value={10}>10 per page</option>
                              <option value={25}>25 per page</option>
                              <option value={50}>50 per page</option>
                              <option value={100}>100 per page</option>
                              <option value={500}>500 per page</option>
                            </Form.Select>
                          </Col>
                        </Row>

                        {/* Table with results */}
                        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                          <Table striped bordered hover responsive size="sm">
                            <thead>
                              <tr>
                                <th>#</th>
                                {Object.keys(results.rows[0]).map((key) => (
                                  <th 
                                    key={key} 
                                    onClick={() => handleSort(key)}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                  >
                                    {key}
                                    {getSortIcon(key)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedData.map((row, idx) => (
                                <tr key={idx}>
                                  <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                  {Object.values(row).map((value, vidx) => (
                                    <td key={vidx}>
                                      {value === null ? <span className="text-muted">NULL</span> : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredCount)} of {filteredCount} entries
                            </div>
                            <Pagination size="sm" className="mb-0">
                              <Pagination.First 
                                onClick={() => setCurrentPage(1)} 
                                disabled={currentPage === 1}
                              />
                              <Pagination.Prev 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                                disabled={currentPage === 1}
                              />
                              
                              {[...Array(totalPages)].map((_, idx) => {
                                const pageNum = idx + 1;
                                // Show first page, last page, current page, and pages around current
                                if (
                                  pageNum === 1 ||
                                  pageNum === totalPages ||
                                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                                ) {
                                  return (
                                    <Pagination.Item
                                      key={pageNum}
                                      active={pageNum === currentPage}
                                      onClick={() => setCurrentPage(pageNum)}
                                    >
                                      {pageNum}
                                    </Pagination.Item>
                                  );
                                } else if (
                                  pageNum === currentPage - 3 ||
                                  pageNum === currentPage + 3
                                ) {
                                  return <Pagination.Ellipsis key={pageNum} disabled />;
                                }
                                return null;
                              })}

                              <Pagination.Next 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                                disabled={currentPage === totalPages}
                              />
                              <Pagination.Last 
                                onClick={() => setCurrentPage(totalPages)} 
                                disabled={currentPage === totalPages}
                              />
                            </Pagination>
                          </div>
                        )}
                      </>
                    ) : results.rows && results.rows.length === 0 ? (
                      <Alert variant="info">No rows returned</Alert>
                    ) : null}
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {/* Query Templates Offcanvas */}
          <Offcanvas 
            show={showTemplates} 
            onHide={() => setShowTemplates(false)} 
            placement="end"
            className="query-templates-offcanvas"
            style={{ width: '500px' }}
          >
            <Offcanvas.Header className="templates-header">
              <Offcanvas.Title>
                <FaCode className="me-2" style={{ fontSize: '24px' }} />
                <span style={{ fontSize: '22px', fontWeight: '700' }}>Query Templates</span>
              </Offcanvas.Title>
              <Button
                variant="link"
                onClick={() => setShowTemplates(false)}
                className="close-btn"
                style={{ fontSize: '24px', color: 'white', textDecoration: 'none' }}
              >
                <FaTimes />
              </Button>
            </Offcanvas.Header>
            <Offcanvas.Body className="templates-body">
              <p className="templates-subtitle">
                Select a template to quickly insert common SQL queries into your editor
              </p>
              {queryTemplates.map((category, catIdx) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={catIdx} className="template-category mb-4">
                    <div className="category-header" style={{ borderLeftColor: category.color }}>
                      <CategoryIcon style={{ color: category.color, fontSize: '20px' }} className="me-2" />
                      <h5 className="mb-0" style={{ color: category.color }}>{category.category}</h5>
                    </div>
                    <div className="templates-grid">
                      {category.templates.map((template, idx) => {
                        const TemplateIcon = template.icon;
                        return (
                          <Card
                            key={idx}
                            className="template-card"
                            onClick={() => {
                              setQuery(template.query);
                              setShowTemplates(false);
                            }}
                          >
                            <Card.Body className="p-3">
                              <div className="d-flex align-items-start mb-2">
                                <div className="template-icon" style={{ backgroundColor: `${category.color}15` }}>
                                  <TemplateIcon style={{ color: category.color }} />
                                </div>
                                <div className="flex-grow-1 ms-3">
                                  <h6 className="template-title mb-1">{template.label}</h6>
                                  <p className="template-description mb-0">{template.description}</p>
                                </div>
                              </div>
                              <div className="template-preview">
                                <code>{template.query.substring(0, 80)}{template.query.length > 80 ? '...' : ''}</code>
                              </div>
                            </Card.Body>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Offcanvas.Body>
          </Offcanvas>
        </Tab>

        {/* Tables Tab */}
        <Tab eventKey="tables" title={<><FaTable className="me-2" />Tables</>}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Database Tables ({filteredTables.length})</span>
              <InputGroup style={{ width: 'auto', maxWidth: '300px' }} size="sm">
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search tables..."
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                />
                {tableSearchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setTableSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </InputGroup>
            </Card.Header>
            <Card.Body>
              {tablesLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading tables...</p>
                </div>
              ) : tablesError ? (
                <Alert variant="danger">
                  <h5><strong>Error loading tables</strong></h5>
                  <hr />
                  <p><strong>Error message:</strong> {tablesError?.data?.message || tablesError?.error || 'Failed to fetch tables'}</p>
                  {tablesError?.status && <p><strong>Status code:</strong> {tablesError.status}</p>}
                  <p className="mb-0"><strong>Possible causes:</strong></p>
                  <ul>
                    <li>Backend server is not running (check if running on port 5000)</li>
                    <li>Database connection issue</li>
                    <li>CORS error - check browser console</li>
                    <li>Invalid API endpoint configuration</li>
                  </ul>
                  <p className="mt-2 mb-0">
                    <small>Check browser console (F12) and backend terminal for more details.</small>
                  </p>
                </Alert>
              ) : filteredTables.length > 0 ? (
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Table Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTables.map((table, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <FaTable className="me-2" />
                            {table}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => loadTableData(table)}
                            >
                              Browse
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => getTableStructure(table)}
                            >
                              Structure
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : tableSearchTerm ? (
                <Alert variant="info">
                  No tables found matching "{tableSearchTerm}"
                </Alert>
              ) : (
                <Alert variant="warning">
                  <strong>No tables found</strong>
                  <p className="mb-0 mt-2">
                    The database might be empty or there was an issue fetching tables.
                    <br />
                    <small>Check browser console for more details.</small>
                  </p>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* History Tab */}
        <Tab eventKey="history" title={<><FaHistory className="me-2" />History</>}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Query History</span>
              {queryHistory.length > 0 && (
                <Button variant="outline-danger" size="sm" onClick={clearHistory}>
                  <FaTrash /> Clear History
                </Button>
              )}
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflow: 'auto' }}>
              {queryHistory.length > 0 ? (
                queryHistory.map((item, idx) => (
                  <Card key={idx} className="mb-2">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <small className="text-muted">
                          {new Date(item.timestamp).toLocaleString()}
                        </small>
                        <div>
                          <Badge bg={item.success ? 'success' : 'danger'} className="me-2">
                            {item.success ? 'Success' : 'Failed'}
                          </Badge>
                          {item.success && (
                            <Badge bg="info">{item.rowCount} rows</Badge>
                          )}
                        </div>
                      </div>
                      <pre style={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f8f9fa', 
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '10px'
                      }}>
                        {item.query}
                      </pre>
                      {!item.success && item.error && (
                        <Alert variant="danger" className="mb-2 py-1">
                          <small>{item.error}</small>
                        </Alert>
                      )}
                      <div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setQuery(item.query);
                            setActiveTab('query');
                          }}
                        >
                          Load Query
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => copyToClipboard(item.query)}
                        >
                          <FaCopy /> Copy
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <Alert variant="info">No query history available</Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminWindowsql;