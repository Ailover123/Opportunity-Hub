const API_BASE_URL = 'http://localhost:3001/api';

// Mock user ID removed - using dynamic userId from AuthContext

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
  async getDashboardStats(userId) {
    return this.request(`/dashboard/${userId}`);
  }

  // Data Sources API
  async getDataSources(userId) {
    return this.request(`/sources/${userId}`);
  }

  async addDataSource(userId, source) {
    return this.request('/sources', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...source
      }),
    });
  }

  async runDataCollection(userId, config = {}) {
    return this.request(`/collect/${userId}`, {
      method: 'POST',
      body: JSON.stringify(config) // Send keywords/config
    });
  }

  async getCollectionStatus(userId) {
    return this.request(`/collection/status/${userId}`);
  }

  async getCollectedData(userId, filters = {}) {
    const params = new URLSearchParams({
      ...filters,
      limit: filters.limit || 100
    });
    return this.request(`/data/${userId}?${params}`);
  }

  // Export API
  async exportData(userId, options = {}) {
    return this.request(`/export/${userId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async downloadFile(filename) {
    const url = `${API_BASE_URL}/download/${filename}`;
    window.open(url, '_blank');
  }

  async getExportHistory(userId) {
    return this.request(`/exports/${userId}`);
  }

  // Schedule API
  async getSchedule(userId) {
    // Currently the backend might not have a GET /schedule endpoint that returns the object directly 
    // but let's assume we might need to query the schedules table or add it.
    // For now, let's assume we can fetch it via a new endpoint or reusing data sources? 
    // Wait, backend server.js has `app.post('/api/schedule/:userId')` but NO GET.
    // I need to add GET /api/schedule/:userId to server.js too!
    return this.request(`/schedule/${userId}`);
  }

  async saveSchedule(userId, schedule) {
    return this.request(`/schedule/${userId}`, {
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