import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Navbar, Nav, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import PriceTimeline from './components/PriceTimeline';
import ChangePointAnalysis from './components/ChangePointAnalysis';
import EventsImpact from './components/EventsImpact';
import Statistics from './components/Statistics';

// Import API service
import { apiService } from './services/apiService';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await apiService.checkHealth();
      setApiStatus('healthy');
      setLoading(false);
    } catch (err) {
      setApiStatus('unhealthy');
      setError('Unable to connect to backend API. Please ensure the Flask server is running.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading Brent Oil Analysis Dashboard...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
          <Container>
            <Navbar.Brand href="/">
              <strong>Brent Oil Change Point Analysis</strong>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link href="/">Dashboard</Nav.Link>
                <Nav.Link href="/timeline">Price Timeline</Nav.Link>
                <Nav.Link href="/change-points">Change Point Analysis</Nav.Link>
                <Nav.Link href="/events">Events Impact</Nav.Link>
                <Nav.Link href="/statistics">Statistics</Nav.Link>
              </Nav>
              <Nav>
                <Nav.Link 
                  className={apiStatus === 'healthy' ? 'text-success' : 'text-danger'}
                >
                  API: {apiStatus === 'healthy' ? '✓' : '✗'}
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container fluid>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<PriceTimeline />} />
            <Route path="/change-points" element={<ChangePointAnalysis />} />
            <Route path="/events" element={<EventsImpact />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App; 