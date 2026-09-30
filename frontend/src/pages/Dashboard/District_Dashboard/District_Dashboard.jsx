import React, { useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useGetDashboardStatisticsQuery } from '../../../redux-slice/masterApiSlice';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import {
  FaUsers, FaCheckCircle, FaChartLine, FaBook, FaMapMarkerAlt, FaTrophy, FaTimesCircle
} from 'react-icons/fa';
import '../State_Dashboard/State_Dashboard.css';

const District_Dashboard = () => {
  // Get D_Code from Redux auth state
  const { userInfo } = useSelector((state) => state.auth);
  const districtCode = userInfo?.D_Code || '00';
  const districtName = userInfo?.Block || 'District';

  // Fetch dashboard data for specific district using D_Code
  const { data: dashboardResponse, isLoading, isError, error } = useGetDashboardStatisticsQuery(districtCode);

  // Process dashboard data
  const dashboardData = useMemo(() => {
    if (!dashboardResponse?.data) return null;
    
    const data = dashboardResponse.data;
    
    // Calculate performance rate (percentage of max possible score assuming 300 max)
    const maxPossibleScore = 300;
    const performanceRate = data.avgScore > 0 
      ? ((parseFloat(data.avgScore) / maxPossibleScore) * 100).toFixed(1)
      : 0;
    
    // Calculate high performers (students above average)
    const highPerformersPercentage = data.scoreRangeDistribution?.find(r => r.range.includes('Excellent'))?.percentage || 0;

    // Prepare top 5 districts for bar chart (in district view, this might be schools or zones)
    const topDistricts = (data.districtWiseStats || [])
      .slice(0, 5)
      .map(item => ({
        name: item.districtName?.split(' ').slice(0, 2).join(' ') || `Zone ${item.districtCode}`,
        count: item.count,
        avgScore: parseFloat(item.avgScore),
        maxScore: parseFloat(item.maxScore),
        fullName: item.districtName
      }));

    // Prepare subject performance data for charts
    const subjectData = (data.subjectPerformance || []).map(item => ({
      subject: item.subject,
      avgScore: parseFloat(item.avgScore),
      avgCorrect: parseFloat(item.avgCorrect),
      avgPercentile: parseFloat(item.avgPercentile || 0),
      // Assuming 100 marks per subject
      percentage: ((parseFloat(item.avgScore) / 100) * 100).toFixed(1)
    }));

    // Prepare score range distribution for pie chart
    const scoreRangeData = (data.scoreRangeDistribution || []).map(item => ({
      name: item.range.split(' ')[0], // Get first word (Excellent, Very Good, etc.)
      value: item.count,
      fullName: item.range,
      percentage: item.percentage
    }));

    // Prepare district performance for line chart
    const districtPerformance = (data.districtWiseStats || []).slice(0, 8).map(item => ({
      name: item.districtName?.split(' ').slice(0, 2).join(' ') || `Zone ${item.districtCode}`,
      avgScore: parseFloat(item.avgScore),
      maxScore: parseFloat(item.maxScore),
      students: item.count
    }));

    // Prepare test distribution
    const testData = (data.testDistribution || []).map(item => ({
      testCode: item.testCode,
      name: item.testName || item.testCode,
      students: item.studentCount,
      avgScore: parseFloat(item.avgScore),
      maxScore: parseFloat(item.maxScore),
      minScore: parseFloat(item.minScore),
      avgCorrect: parseFloat(item.avgCorrect),
      avgPhysics: parseFloat(item.avgPhysics),
      avgChemistry: parseFloat(item.avgChemistry),
      avgMaths: parseFloat(item.avgMaths),
      avgPercentile: parseFloat(item.avgPercentile || 0),
      maxPercentile: parseFloat(item.maxPercentile || 0),
      minPercentile: parseFloat(item.minPercentile || 0),
      avgPhyPercentile: parseFloat(item.avgPhyPercentile || 0),
      avgChePercentile: parseFloat(item.avgChePercentile || 0),
      avgMatPercentile: parseFloat(item.avgMatPercentile || 0)
    }));

    // Prepare top 6 tests by performance
    const topTests = [...testData]
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 6)
      .map(test => ({
        name: test.name.length > 20 ? test.name.substring(0, 20) + '...' : test.name,
        avgScore: test.avgScore,
        students: test.students
      }));

    // Prepare accuracy data for display
    const accuracyMetrics = [
      { name: 'Correct Answers', percentage: parseFloat(data.accuracyData?.correct || 0), color: '#06A77D' },
      { name: 'Wrong Answers', percentage: parseFloat(data.accuracyData?.wrong || 0), color: '#D62828' },
      { name: 'Blank/Unattempted', percentage: parseFloat(data.accuracyData?.blank || 0), color: '#7c8db5' }
    ];

    // Prepare conversion funnel data
    const highPerformers = scoreRangeData.find(r => r.name === 'Excellent')?.value || 0;
    const aboveAverage = scoreRangeData.filter(r => ['Excellent', 'Very'].includes(r.name.split(' ')[0]))
      .reduce((sum, item) => sum + item.value, 0);
    
    const conversionData = [
      { stage: 'Total Students', count: data.totalStudents, percentage: 100 },
      { stage: 'Above Average', count: aboveAverage, percentage: data.totalStudents > 0 ? ((aboveAverage / data.totalStudents) * 100).toFixed(0) : 0 },
      { stage: 'High Performers', count: highPerformers, percentage: data.totalStudents > 0 ? ((highPerformers / data.totalStudents) * 100).toFixed(0) : 0 },
    ];

    return {
      ...data,
      performanceRate,
      highPerformersPercentage,
      topDistricts,
      subjectData,
      scoreRangeData,
      districtPerformance,
      testData,
      accuracyMetrics,
      conversionData,
      topTests
    };
  }, [dashboardResponse]);

  if (isLoading) {
    return (
      <Container className="dashboard-container">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading district dashboard data...</p>
        </div>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="dashboard-container">
        <Alert variant="danger">
          Error loading dashboard: {error?.data?.message || error?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container className="dashboard-container">
        <Alert variant="warning">No dashboard data available for this district</Alert>
      </Container>
    );
  }

  // Colors for charts
  const COLORS = ['#FF6B35', '#004E89', '#F77F00', '#06A77D', '#D62828', '#8338EC'];

  return (
    <Container fluid className="state-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>
          <FaMapMarkerAlt style={{ marginRight: '10px', color: '#FF6B35' }} />
          {districtName} District Dashboard
        </h2>
        <div className="dashboard-user-info">
          <span className="user-name">{userInfo?.User_Name || 'District Admin'}</span>
          <span style={{ marginLeft: '10px', color: '#7c8db5', fontSize: '13px' }}>
            District Code: {districtCode}
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <Row className="metric-cards-row">
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="metric-card metric-card-1">
            <Card.Body>
              <div className="metric-icon">
                <FaUsers />
              </div>
              <div className="metric-content">
                <div className="metric-label">Total Students</div>
                <div className="metric-value">{dashboardData.totalStudents.toLocaleString()}</div>
                <div className="metric-change positive">In district</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="metric-card metric-card-2">
            <Card.Body>
              <div className="metric-icon">
                <FaChartLine />
              </div>
              <div className="metric-content">
                <div className="metric-label">Average Score</div>
                <div className="metric-value">{parseFloat(dashboardData.avgScore).toFixed(1)}</div>
                <div className="metric-change">Out of 300</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="metric-card metric-card-3">
            <Card.Body>
              <div className="metric-icon">
                <FaTrophy />
              </div>
              <div className="metric-content">
                <div className="metric-label">Max Score</div>
                <div className="metric-value">{parseFloat(dashboardData.maxScore).toFixed(1)}</div>
                <div className="metric-change positive">Top scorer</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="metric-card metric-card-4">
            <Card.Body>
              <div className="metric-icon">
                <FaBook />
              </div>
              <div className="metric-content">
                <div className="metric-label">Total Tests</div>
                <div className="metric-value">{dashboardData.totalTests}</div>
                <div className="metric-change positive">Active</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Dashboard Content */}
      <Row>
        {/* Full Width - Test Performance Line Graph */}
        <Col xs={12} className="mb-4">
          <Card className="dashboard-card">
            <Card.Body>
              <div className="card-header-section">
                <h5>📊 Test Percentile Trends for {districtName} ({dashboardData.testData.length} Tests)</h5>
                <span className="see-all-link">District Overview</span>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData.testData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="testCode" 
                    stroke="#999" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                    fontSize={10}
                  />
                  <YAxis stroke="#999" label={{ value: 'Percentile', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    formatter={(value, name) => {
                      if (name === 'avgPercentile') return [parseFloat(value).toFixed(2), 'Avg Percentile'];
                      if (name === 'maxPercentile') return [parseFloat(value).toFixed(2), 'Max Percentile'];
                      if (name === 'minPercentile') return [parseFloat(value).toFixed(2), 'Min Percentile'];
                      if (name === 'students') return [value, 'Students'];
                      return [parseFloat(value).toFixed(2), name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgPercentile" stroke="#FF6B35" strokeWidth={3} name="Avg Percentile" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="maxPercentile" stroke="#06A77D" strokeWidth={2} name="Max Percentile" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="minPercentile" stroke="#D62828" strokeWidth={2} name="Min Percentile" dot={{ r: 3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Test Subject Performance Trends */}
        <Col xs={12} className="mb-4">
          <Card className="dashboard-card">
            <Card.Body>
              <div className="card-header-section">
                <h5>📚 Subject-wise Percentile Performance</h5>
                <span className="see-all-link">Physics, Chemistry, Maths Trends</span>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dashboardData.testData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="testCode" 
                    stroke="#999" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                    fontSize={10}
                  />
                  <YAxis stroke="#999" label={{ value: 'Subject Percentile', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                    formatter={(value, name) => [parseFloat(value).toFixed(2), name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgPhyPercentile" stroke="#004E89" strokeWidth={2} name="Physics Percentile" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avgChePercentile" stroke="#F77F00" strokeWidth={2} name="Chemistry Percentile" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avgMatPercentile" stroke="#8338EC" strokeWidth={2} name="Maths Percentile" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Dashboard Content */}
      <Row>
        {/* Left Column */}
        <Col lg={8}>
          {/* District Performance Chart */}
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <div className="card-header-section">
                <h5>Performance Analytics</h5>
                <div className="time-filter">
                  <span className="active">District Overview</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.districtPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgScore" stroke="#FF6B35" strokeWidth={3} name="Avg Score" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="maxScore" stroke="#06A77D" strokeWidth={2} name="Max Score" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          {/* Subject Performance & Accuracy Breakdown */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="card-header-section">
                    <h5>📚 Subject Percentile</h5>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboardData.subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="subject" stroke="#999" />
                      <YAxis stroke="#999" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="avgPercentile" fill="#FF6B35" radius={[8, 8, 0, 0]} name="Avg Percentile" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="card-header-section">
                    <h5>🎯 Response Accuracy Breakdown</h5>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.accuracyMetrics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {dashboardData.accuracyMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Bottom Row - Three Charts */}
          <Row>
            <Col md={4} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <h5>📊 Score Distribution</h5>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboardData.scoreRangeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#999" />
                      <YAxis type="category" dataKey="name" stroke="#999" width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                        formatter={(value) => [value, 'Students']}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {dashboardData.scoreRangeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <h5>🏆 Top Performing Tests</h5>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboardData.topTests} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#999" />
                      <YAxis type="category" dataKey="name" stroke="#999" width={120} fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                      <Bar dataKey="avgScore" fill="#FF6B35" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="card-header-section">
                    <h5>📈 Test Participation</h5>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={dashboardData.testData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="testCode" stroke="#999" fontSize={11} />
                      <YAxis stroke="#999" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="students" stroke="#004E89" fill="#004E89" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Row - Multi-metric Charts */}
          <Row>
            <Col md={6} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <h5>Student Distribution</h5>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboardData.topDistricts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#999" angle={-15} textAnchor="end" height={70} />
                      <YAxis stroke="#999" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                        formatter={(value, name) => {
                          if (name === 'count') return [value, 'Students'];
                          if (name === 'avgScore') return [parseFloat(value).toFixed(1), 'Avg Score'];
                          return value;
                        }}
                      />
                      <Bar dataKey="count" fill="#FF6B35" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="card-header-section">
                    <h5>Performance Funnel</h5>
                  </div>
                  <div className="conversion-funnel">
                    {dashboardData.conversionData.map((item, index) => (
                      <div key={index} className="funnel-stage">
                        <div className="funnel-bar-container">
                          <div 
                            className="funnel-bar" 
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          >
                            <span className="funnel-label">{item.stage}</span>
                          </div>
                        </div>
                        <div className="funnel-stats">
                          <span className="funnel-count">{item.count.toLocaleString()}</span>
                          <span className="funnel-percentage">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card className="dashboard-card">
                <Card.Body>
                  <div className="card-header-section">
                    <h5>📊 Subject Comparison</h5>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={dashboardData.subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="subject" stroke="#999" />
                      <YAxis stroke="#999" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="avgPercentile" fill="#FF6B35" name="Avg Percentile" />
                      <Line type="monotone" dataKey="avgCorrect" stroke="#06A77D" strokeWidth={3} name="Avg Correct" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Performance Target */}
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <div className="card-header-section">
                <h5>Overall Performance</h5>
              </div>
              <div className="target-circle">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="90%"
                    data={[{ name: 'Performance', value: parseFloat(dashboardData.performanceRate), fill: '#FF6B35' }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="target-percentage">
                  <span className="percentage-value">{dashboardData.performanceRate}%</span>
                  <span className="percentage-label">of max score</span>
                </div>
              </div>
              <div className="target-message">
                <p className="success-message">📊 Performance Metrics</p>
                <p className="target-details">
                  Avg Score: <span className="target-value">{parseFloat(dashboardData.avgScore).toFixed(2)}</span>
                </p>
                <p className="target-details">
                  Max Score: <span className="target-value">{parseFloat(dashboardData.maxScore).toFixed(2)}</span>
                </p>
                <p className="target-details">
                  Min Score: <span className="target-value">{parseFloat(dashboardData.minScore).toFixed(2)}</span>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Score Distribution */}
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <div className="card-header-section">
                <h5>Score Distribution</h5>
                <span className="see-all-link">View Details</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.scoreRangeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.percentage}%`}
                  >
                    {dashboardData.scoreRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {dashboardData.scoreRangeData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="legend-label">{item.fullName}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Subject Performance */}
          <Card className="dashboard-card mb-4">
            <Card.Body>
              <div className="card-header-section">
                <h5>Subject Performance</h5>
              </div>
              <div className="traffic-sources">
                {dashboardData.subjectData.map((subject, index) => (
                  <div key={index} className="traffic-item">
                    <div className="traffic-info">
                      <span className="traffic-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="traffic-name">{subject.subject}</span>
                    </div>
                    <span className="traffic-percentage">{subject.percentage}%</span>
                  </div>
                ))}
              </div>
              <div className="target-message mt-3">
                <p className="target-details">
                  <strong>Response Accuracy</strong>
                </p>
                {dashboardData.accuracyMetrics.map((metric, index) => (
                  <p key={index} className="target-details">
                    {metric.name}: <span className="target-value" style={{ color: metric.color }}>{metric.percentage}%</span>
                  </p>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default District_Dashboard;
