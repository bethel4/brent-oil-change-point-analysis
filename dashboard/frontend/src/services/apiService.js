import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async checkHealth() {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Oil prices data
  async getOilPrices() {
    const response = await apiClient.get('/api/data/oil-prices');
    return response.data;
  },

  // Events data
  async getEvents() {
    const response = await apiClient.get('/api/data/events');
    return response.data;
  },

  // Run change point analysis
  async runChangePointAnalysis(parameters = {}) {
    const response = await apiClient.post('/api/analysis/change-points', parameters);
    return response.data;
  },

  // Get statistics
  async getStatistics() {
    const response = await apiClient.get('/api/analysis/statistics');
    return response.data;
  },

  // Get events impact
  async getEventsImpact() {
    const response = await apiClient.get('/api/analysis/events-impact');
    return response.data;
  },

  // Get price timeline data
  async getPriceTimeline() {
    const response = await apiClient.get('/api/visualization/price-timeline');
    return response.data;
  },

  // Get change point visualization data
  async getChangePointVisualization() {
    const response = await apiClient.get('/api/visualization/change-point-analysis');
    return response.data;
  },
};

export default apiService; 