import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import apiService from '../services/apiService';

const EventsImpact = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsData, setEventsData] = useState(null);

  useEffect(() => {
    loadEventsData();
  }, []);

  const loadEventsData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEventsImpact();
      setEventsData(data);
    } catch (err) {
      setError('Failed to load events impact data: ' + err.message);
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
        <p className="mt-3">Loading events impact analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Events Impact</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  const { event_impacts, summary } = eventsData || {};

  // Prepare data for charts
  const impactChartData = event_impacts?.map(event => ({
    event: event.event.substring(0, 20) + '...',
    priceChange: event.price_change_pct,
    type: event.type,
    impact: event.impact
  })) || [];

  const typeImpactData = event_impacts?.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = { count: 0, totalImpact: 0 };
    }
    acc[event.type].count++;
    acc[event.type].totalImpact += event.price_change_pct;
    return acc;
  }, {}) || {};

  const typeChartData = Object.entries(typeImpactData).map(([type, data]) => ({
    type,
    averageImpact: data.totalImpact / data.count,
    count: data.count
  }));

  return (
    <div className="events-impact">
      <h1 className="mb-4">Events Impact Analysis</h1>
      
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Events Analyzed</Card.Title>
              <Card.Text className="h3 text-primary">
                {summary?.total_events_analyzed || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Average Price Change</Card.Title>
              <Card.Text className={`h3 ${summary?.average_price_change > 0 ? 'text-success' : 'text-danger'}`}>
                {summary?.average_price_change?.toFixed(2) || 0}%
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Geopolitical Events</Card.Title>
              <Card.Text className="h3 text-warning">
                {summary?.events_by_type?.Geopolitical || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>OPEC Events</Card.Title>
              <Card.Text className="h3 text-success">
                {summary?.events_by_type?.OPEC || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Price Change Chart */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Price Change Impact by Event</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={impactChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="event" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Price Change']}
                    labelFormatter={(label) => `Event: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="priceChange" 
                    fill="#8884d8"
                    name="Price Change (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Event Type Impact Chart */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Average Impact by Event Type</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Average Impact']}
                  />
                  <Bar 
                    dataKey="averageImpact" 
                    fill="#82ca9d"
                    name="Average Impact (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Event Type Distribution</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Bar 
                    dataKey="count" 
                    fill="#ffc658"
                    name="Event Count"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Events Table */}
      <Card>
        <Card.Header>
          <h5>Detailed Events Impact Analysis</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Impact Level</th>
                  <th>Price at Event</th>
                  <th>Price Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {event_impacts?.map((event, index) => (
                  <tr key={index}>
                    <td>{event.event}</td>
                    <td>{event.date}</td>
                    <td>
                      <Badge bg={event.type === 'Geopolitical' ? 'warning' : 'success'}>
                        {event.type}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={
                        event.impact === 'High' ? 'danger' : 
                        event.impact === 'Medium' ? 'warning' : 'info'
                      }>
                        {event.impact}
                      </Badge>
                    </td>
                    <td>${event.price_at_event?.toFixed(2)}</td>
                    <td className={event.price_change_pct > 0 ? 'text-success' : 'text-danger'}>
                      {event.price_change_pct?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Key Insights */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Key Insights</h5>
            </Card.Header>
            <Card.Body>
              <ul>
                <li>
                  <strong>Most Impactful Event Type:</strong> {
                    typeChartData.length > 0 
                      ? typeChartData.reduce((max, item) => 
                          Math.abs(item.averageImpact) > Math.abs(max.averageImpact) ? item : max
                        ).type
                      : 'N/A'
                  }
                </li>
                <li>
                  <strong>Average Price Change:</strong> {summary?.average_price_change?.toFixed(2)}%
                </li>
                <li>
                  <strong>Events with Positive Impact:</strong> {
                    event_impacts?.filter(e => e.price_change_pct > 0).length || 0
                  } out of {event_impacts?.length || 0}
                </li>
                <li>
                  <strong>Events with Negative Impact:</strong> {
                    event_impacts?.filter(e => e.price_change_pct < 0).length || 0
                  } out of {event_impacts?.length || 0}
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EventsImpact; 