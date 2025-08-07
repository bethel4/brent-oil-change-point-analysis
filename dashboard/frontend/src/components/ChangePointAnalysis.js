import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import apiService from '../services/apiService';

const ChangePointAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisParams, setAnalysisParams] = useState({
    samples: 2000,
    tune: 1000
  });

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnalysisProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const results = await apiService.runChangePointAnalysis(analysisParams);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisData(results);

      // Reset progress after a delay
      setTimeout(() => setAnalysisProgress(0), 2000);

    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVisualizationData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChangePointVisualization();
      setAnalysisData(data);
    } catch (err) {
      setError('Failed to load visualization data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisualizationData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">
          {analysisProgress > 0 ? 'Running Bayesian Analysis...' : 'Loading analysis data...'}
        </p>
        {analysisProgress > 0 && (
          <ProgressBar 
            now={analysisProgress} 
            label={`${analysisProgress}%`}
            className="mt-3"
            style={{ maxWidth: '400px', margin: '0 auto' }}
          />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div className="change-point-analysis">
      <h1 className="mb-4">Change Point Analysis</h1>
      
      {/* Analysis Controls */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Analysis Parameters</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <label>MCMC Samples:</label>
              <input
                type="number"
                className="form-control"
                value={analysisParams.samples}
                onChange={(e) => setAnalysisParams(prev => ({ ...prev, samples: parseInt(e.target.value) }))}
                min="1000"
                max="5000"
              />
            </Col>
            <Col md={4}>
              <label>Tuning Steps:</label>
              <input
                type="number"
                className="form-control"
                value={analysisParams.tune}
                onChange={(e) => setAnalysisParams(prev => ({ ...prev, tune: parseInt(e.target.value) }))}
                min="500"
                max="2000"
              />
            </Col>
            <Col md={4}>
              <label>&nbsp;</label>
              <Button 
                variant="primary" 
                onClick={runAnalysis}
                disabled={loading}
                className="w-100"
              >
                Run Analysis
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {analysisData && (
        <>
          {/* Change Point Summary */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Detected Change Point</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center">
                    <h3 className="text-primary">{analysisData.change_point?.date}</h3>
                    <p className="text-muted">Observation Index: {analysisData.change_point?.index}</p>
                    <Badge bg="info">Bayesian Analysis</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Impact Analysis</h5>
                </Card.Header>
                <Card.Body>
                  {analysisData.impact_report && (
                    <div>
                      <p><strong>Price Change:</strong> {analysisData.impact_report.price_impact?.price_change_pct?.toFixed(2)}%</p>
                      <p><strong>Before Mean:</strong> ${analysisData.impact_report.price_impact?.mean_before?.toFixed(2)}</p>
                      <p><strong>After Mean:</strong> ${analysisData.impact_report.price_impact?.mean_after?.toFixed(2)}</p>
                      <p><strong>Statistical Significance:</strong> 
                        <Badge bg={analysisData.impact_report.statistical_test?.significant ? 'success' : 'secondary'} className="ms-2">
                          {analysisData.impact_report.statistical_test?.significant ? 'Yes' : 'No'}
                        </Badge>
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Price Chart with Change Point */}
          <Card className="mb-4">
            <Card.Header>
              <h5>Price Timeline with Change Point</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={[
                  ...(analysisData.before_period?.data || []),
                  ...(analysisData.after_period?.data || [])
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
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
                  
                  {/* Change point reference line */}
                  <ReferenceLine
                    x={analysisData.change_point?.date}
                    stroke="#ff0000"
                    strokeWidth={3}
                    label={{
                      value: 'Change Point',
                      position: 'top',
                      fontSize: 12,
                      fill: '#ff0000'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          {/* Before vs After Comparison */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>Before Change Point</h5>
                </Card.Header>
                <Card.Body>
                  {analysisData.before_period?.statistics && (
                    <div>
                      <p><strong>Mean Price:</strong> ${analysisData.before_period.statistics.mean_price?.toFixed(2)}</p>
                      <p><strong>Standard Deviation:</strong> ${analysisData.before_period.statistics.std_price?.toFixed(2)}</p>
                      <p><strong>Observations:</strong> {analysisData.before_period.statistics.count}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5>After Change Point</h5>
                </Card.Header>
                <Card.Body>
                  {analysisData.after_period?.statistics && (
                    <div>
                      <p><strong>Mean Price:</strong> ${analysisData.after_period.statistics.mean_price?.toFixed(2)}</p>
                      <p><strong>Standard Deviation:</strong> ${analysisData.after_period.statistics.std_price?.toFixed(2)}</p>
                      <p><strong>Observations:</strong> {analysisData.after_period.statistics.count}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Associated Events */}
          {analysisData.impact_report?.nearby_events && analysisData.impact_report.nearby_events.length > 0 && (
            <Card>
              <Card.Header>
                <h5>Associated Events</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Days from Change Point</th>
                        <th>Type</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.impact_report.nearby_events.map((event, index) => (
                        <tr key={index}>
                          <td>{event.event}</td>
                          <td>{event.date}</td>
                          <td>{event.days_from_change}</td>
                          <td>
                            <Badge bg={event.type === 'Geopolitical' ? 'warning' : 'success'}>
                              {event.type}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={event.impact === 'High' ? 'danger' : 'warning'}>
                              {event.impact}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ChangePointAnalysis; 