import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import apiService from '../services/apiService';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    loadStatisticsData();
  }, []);

  const loadStatisticsData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStatistics();
      setStatsData(data);
    } catch (err) {
      setError('Failed to load statistics: ' + err.message);
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
        <p className="mt-3">Loading statistical analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Statistics</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  const { price_statistics, returns_statistics, volatility_analysis } = statsData || {};

  // Prepare volatility data for chart
  const volatilityData = volatility_analysis?.rolling_std_30d?.map((value, index) => ({
    index,
    volatility_30d: value,
    volatility_90d: volatility_analysis?.rolling_std_90d?.[index] || 0
  })) || [];

  return (
    <div className="statistics">
      <h1 className="mb-4">Statistical Analysis</h1>
      
      {/* Price Statistics */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Price Statistics</h5>
            </Card.Header>
            <Card.Body>
              {price_statistics && (
                <div>
                  <Row>
                    <Col md={6}>
                      <p><strong>Mean:</strong> ${price_statistics.mean?.toFixed(2)}</p>
                      <p><strong>Median:</strong> ${price_statistics.median?.toFixed(2)}</p>
                      <p><strong>Standard Deviation:</strong> ${price_statistics.std?.toFixed(2)}</p>
                      <p><strong>Minimum:</strong> ${price_statistics.min?.toFixed(2)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Maximum:</strong> ${price_statistics.max?.toFixed(2)}</p>
                      <p><strong>Range:</strong> ${price_statistics.range?.toFixed(2)}</p>
                      <p><strong>Coefficient of Variation:</strong> {price_statistics.cv?.toFixed(4)}</p>
                      <p><strong>Skewness:</strong> {price_statistics.skewness?.toFixed(4)}</p>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Returns Statistics</h5>
            </Card.Header>
            <Card.Body>
              {returns_statistics && (
                <div>
                  <Row>
                    <Col md={6}>
                      <p><strong>Mean:</strong> {returns_statistics.mean?.toFixed(6)}</p>
                      <p><strong>Median:</strong> {returns_statistics.median?.toFixed(6)}</p>
                      <p><strong>Standard Deviation:</strong> {returns_statistics.std?.toFixed(6)}</p>
                      <p><strong>Minimum:</strong> {returns_statistics.min?.toFixed(6)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Maximum:</strong> {returns_statistics.max?.toFixed(6)}</p>
                      <p><strong>Range:</strong> {returns_statistics.range?.toFixed(6)}</p>
                      <p><strong>Coefficient of Variation:</strong> {returns_statistics.cv?.toFixed(4)}</p>
                      <p><strong>Kurtosis:</strong> {returns_statistics.kurtosis?.toFixed(4)}</p>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Volatility Analysis */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Volatility Analysis</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={volatilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index" 
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Time Period', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Volatility', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(6), 'Volatility']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="volatility_30d" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="30-Day Rolling Volatility"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volatility_90d" 
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="90-Day Rolling Volatility"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Distribution Analysis */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Price Distribution Analysis</h5>
            </Card.Header>
            <Card.Body>
              {price_statistics && (
                <div>
                  <p><strong>Distribution Shape:</strong> 
                    <Badge bg={price_statistics.skewness > 0 ? 'warning' : 'info'} className="ms-2">
                      {price_statistics.skewness > 0 ? 'Right-Skewed' : 'Left-Skewed'}
                    </Badge>
                  </p>
                  <p><strong>Variability:</strong> 
                    <Badge bg={price_statistics.cv > 0.5 ? 'danger' : 'success'} className="ms-2">
                      {price_statistics.cv > 0.5 ? 'High' : 'Low'}
                    </Badge>
                  </p>
                  <p><strong>Price Range:</strong> ${price_statistics.range?.toFixed(2)}</p>
                  <p><strong>Interquartile Range:</strong> ${(price_statistics.max - price_statistics.min) * 0.5?.toFixed(2)}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Returns Distribution Analysis</h5>
            </Card.Header>
            <Card.Body>
              {returns_statistics && (
                <div>
                  <p><strong>Distribution Shape:</strong> 
                    <Badge bg={returns_statistics.skewness > 0 ? 'warning' : 'info'} className="ms-2">
                      {returns_statistics.skewness > 0 ? 'Right-Skewed' : 'Left-Skewed'}
                    </Badge>
                  </p>
                  <p><strong>Tail Behavior:</strong> 
                    <Badge bg={returns_statistics.kurtosis > 3 ? 'danger' : 'success'} className="ms-2">
                      {returns_statistics.kurtosis > 3 ? 'Heavy Tails' : 'Normal Tails'}
                    </Badge>
                  </p>
                  <p><strong>Volatility:</strong> {returns_statistics.std?.toFixed(6)}</p>
                  <p><strong>Risk Level:</strong> 
                    <Badge bg={returns_statistics.std > 0.05 ? 'danger' : 'success'} className="ms-2">
                      {returns_statistics.std > 0.05 ? 'High' : 'Low'}
                    </Badge>
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistical Insights */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5>Key Statistical Insights</h5>
            </Card.Header>
            <Card.Body>
              <ul>
                <li>
                  <strong>Price Stability:</strong> {
                    price_statistics?.cv < 0.3 ? 'Prices are relatively stable' :
                    price_statistics?.cv < 0.6 ? 'Prices show moderate volatility' :
                    'Prices are highly volatile'
                  }
                </li>
                <li>
                  <strong>Returns Distribution:</strong> {
                    returns_statistics?.kurtosis > 3 ? 'Returns show fat tails (extreme events more likely)' :
                    'Returns follow approximately normal distribution'
                  }
                </li>
                <li>
                  <strong>Market Efficiency:</strong> {
                    returns_statistics?.mean?.toFixed(6) === '0.000000' ? 'Returns are approximately zero-mean' :
                    'Returns show systematic bias'
                  }
                </li>
                <li>
                  <strong>Risk Assessment:</strong> {
                    returns_statistics?.std > 0.05 ? 'High volatility indicates significant risk' :
                    'Low volatility suggests relatively stable returns'
                  }
                </li>
                <li>
                  <strong>Volatility Clustering:</strong> {
                    volatility_analysis?.rolling_std_30d?.length > 0 ? 'Rolling volatility analysis available' :
                    'Insufficient data for volatility clustering analysis'
                  }
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics; 