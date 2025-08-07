import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import apiService from '../services/apiService';

const PriceTimeline = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [showEvents, setShowEvents] = useState(true);

  useEffect(() => {
    loadTimelineData();
  }, []);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPriceTimeline();
      setTimelineData(data);
    } catch (err) {
      setError('Failed to load timeline data: ' + err.message);
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
        <p className="mt-3">Loading price timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Timeline</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  // Filter events based on selection
  const filteredEvents = timelineData?.annotations?.filter(event => {
    if (selectedEventType === 'all') return true;
    return event.type === selectedEventType;
  }) || [];

  // Get unique event types for filter
  const eventTypes = [...new Set(timelineData?.annotations?.map(event => event.type) || [])];

  return (
    <div className="price-timeline">
      <h1 className="mb-4">Brent Oil Price Timeline</h1>
      
      {/* Controls */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Event Type Filter</Form.Label>
            <Form.Select 
              value={selectedEventType} 
              onChange={(e) => setSelectedEventType(e.target.value)}
            >
              <option value="all">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Display Options</Form.Label>
            <Form.Check
              type="switch"
              id="show-events-switch"
              label="Show Event Annotations"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Price Chart */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Price Timeline with Events</h5>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={timelineData?.timeline_data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
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
                name="Brent Oil Price"
              />
              
              {/* Event reference lines */}
              {showEvents && filteredEvents.map((event, index) => (
                <ReferenceLine
                  key={index}
                  x={event.date}
                  stroke={event.type === 'Geopolitical' ? '#ff7300' : '#00ff00'}
                  strokeDasharray="3 3"
                  label={{
                    value: event.event,
                    position: 'top',
                    fontSize: 10,
                    fill: event.type === 'Geopolitical' ? '#ff7300' : '#00ff00'
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      {/* Events Table */}
      {showEvents && (
        <Card>
          <Card.Header>
            <h5>Events List</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event, index) => (
                    <tr key={index}>
                      <td>{event.date}</td>
                      <td>{event.event}</td>
                      <td>
                        <span className={`badge ${
                          event.type === 'Geopolitical' ? 'bg-warning' : 'bg-success'
                        }`}>
                          {event.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          event.impact === 'High' ? 'bg-danger' : 
                          event.impact === 'Medium' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {event.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Summary Statistics */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6>Timeline Summary</h6>
            </Card.Header>
            <Card.Body>
              <p><strong>Total Data Points:</strong> {timelineData?.timeline_data?.length || 0}</p>
              <p><strong>Date Range:</strong> {
                timelineData?.timeline_data?.length > 0 
                  ? `${timelineData.timeline_data[0].date} to ${timelineData.timeline_data[timelineData.timeline_data.length - 1].date}`
                  : 'N/A'
              }</p>
              <p><strong>Filtered Events:</strong> {filteredEvents.length}</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6>Price Statistics</h6>
            </Card.Header>
            <Card.Body>
              {timelineData?.timeline_data?.length > 0 && (
                <>
                  <p><strong>Min Price:</strong> ${Math.min(...timelineData.timeline_data.map(d => d.price)).toFixed(2)}</p>
                  <p><strong>Max Price:</strong> ${Math.max(...timelineData.timeline_data.map(d => d.price)).toFixed(2)}</p>
                  <p><strong>Average Price:</strong> ${(timelineData.timeline_data.reduce((sum, d) => sum + d.price, 0) / timelineData.timeline_data.length).toFixed(2)}</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PriceTimeline; 