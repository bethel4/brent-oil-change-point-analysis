import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../services/apiService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    oilPrices: null,
    events: null,
    statistics: null,
    changePoint: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [oilPrices, events, statistics, changePoint] = await Promise.all([
        apiService.getOilPrices(),
        apiService.getEvents(),
        apiService.getStatistics(),
        apiService.getChangePointVisualization()
      ]);

      setDashboardData({
        oilPrices,
        events,
        statistics,
        changePoint
      });
      
    } catch (err) {
      setError('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Dashboard</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  const { oilPrices, events, statistics, changePoint } = dashboardData;

  // Prepare chart data (last 50 data points for performance)
  const chartData = oilPrices?.data?.slice(-50) || [];

  return (
    <div className="dashboard">
      <h1 className="mb-4">Brent Oil Change Point Analysis Dashboard</h1>
      
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Observations</Card.Title>
              <Card.Text className="h3 text-primary">
                {oilPrices?.summary?.total_observations || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Events</Card.Title>
              <Card.Text className="h3 text-success">
                {events?.summary?.total_events || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Change Point Date</Card.Title>
              <Card.Text className="h5 text-warning">
                {changePoint?.change_point?.date || 'N/A'}
              </Card.Text>
            </Card.Body>
          </Card>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Price Range</Card.Title>
              <Card.Text className="h6">
                ${oilPrices?.summary?.price_stats?.min?.toFixed(2) || 0} - 
                ${oilPrices?.summary?.price_stats?.max?.toFixed(2) || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Price Chart */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Brent Oil Price Timeline</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistics and Events */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Price Statistics</h5>
            </Card.Header>
            <Card.Body>
              {statistics?.price_statistics && (
                <div>
                  <p><strong>Mean Price:</strong> ${statistics.price_statistics.mean?.toFixed(2)}</p>
                  <p><strong>Standard Deviation:</strong> ${statistics.price_statistics.std?.toFixed(2)}</p>
                  <p><strong>Min Price:</strong> ${statistics.price_statistics.min?.toFixed(2)}</p>
                  <p><strong>Max Price:</strong> ${statistics.price_statistics.max?.toFixed(2)}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Events Summary</h5>
            </Card.Header>
            <Card.Body>
              {events?.summary && (
                <div>
                  <p><strong>Geopolitical Events:</strong> {events.summary.event_types?.Geopolitical || 0}</p>
                  <p><strong>OPEC Events:</strong> {events.summary.event_types?.OPEC || 0}</p>
                  <p><strong>High Impact Events:</strong> {events.summary.impact_levels?.High || 0}</p>
                  <p><strong>Medium Impact Events:</strong> {events.summary.impact_levels?.Medium || 0}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Change Point Analysis Summary */}
      {changePoint && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5>Change Point Analysis Summary</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Before Change Point</h6>
                    <p><strong>Mean Price:</strong> ${changePoint.before_period?.statistics?.mean_price?.toFixed(2)}</p>
                    <p><strong>Standard Deviation:</strong> ${changePoint.before_period?.statistics?.std_price?.toFixed(2)}</p>
                    <p><strong>Observations:</strong> {changePoint.before_period?.statistics?.count}</p>
                  </Col>
                  <Col md={6}>
                    <h6>After Change Point</h6>
                    <p><strong>Mean Price:</strong> ${changePoint.after_period?.statistics?.mean_price?.toFixed(2)}</p>
                    <p><strong>Standard Deviation:</strong> ${changePoint.after_period?.statistics?.std_price?.toFixed(2)}</p>
                    <p><strong>Observations:</strong> {changePoint.after_period?.statistics?.count}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard; 