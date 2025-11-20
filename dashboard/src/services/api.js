const API_BASE_URL = 'http://localhost:3001/api';

// Mock user ID for demo purposes
const DEMO_USER_ID = 'demo-user-123';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Dashboard API
  async getDashboardStats() {
    return this.request(`/dashboard/${DEMO_USER_ID}`);
  }

  // Data Sources API
  async getDataSources() {
    return this.request(`/sources/${DEMO_USER_ID}`);
  }

  async addDataSource(source) {
    return this.request('/sources', {
      method: 'POST',
      body: JSON.stringify({
        userId: DEMO_USER_ID,
        ...source
      }),
    });
  }

  // Data Collection API
  async runDataCollection() {
    return this.request(`/collect/${DEMO_USER_ID}`, {
      method: 'POST',
    });
  }

  async getCollectedData(filters = {}) {
    const params = new URLSearchParams({
      ...filters,
      limit: filters.limit || 100
    });
    return this.request(`/data/${DEMO_USER_ID}?${params}`);
  }

  // Export API
  async exportData(options = {}) {
    return this.request(`/export/${DEMO_USER_ID}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async downloadFile(filename) {
    const url = `${API_BASE_URL}/download/${filename}`;
    window.open(url, '_blank');
  }

  // Schedule API
  async saveSchedule(schedule) {
    return this.request(`/schedule/${DEMO_USER_ID}`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();