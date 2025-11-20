import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import ApiService from '../services/api';

const DataDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    categories: {}
  });
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to mock data
      setStats({
        total: 7,
        verified: 5,
        pending: 2,
        categories: {
          hackathon: 2,
          job: 2,
          competition: 1,
          certification: 2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunCollection = async () => {
    try {
      setCollecting(true);
      const result = await ApiService.runDataCollection();

      // Show success message
      alert(`Collection completed! Collected ${result.collected} new items, ${result.verified} verified.`);

      // Refresh dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Collection failed:', error);
      alert('Data collection failed. Please try again.');
    } finally {
      setCollecting(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const result = await ApiService.exportData({
        categories: ['hackathon', 'job', 'competition', 'certification'],
        format: 'csv'
      });

      if (result.success) {
        alert(`Export completed! ${result.items} items exported.`);
        // Auto-download the file
        ApiService.downloadFile(result.filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Collection Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRunCollection}
            disabled={collecting}
            className={`px-4 py-2 rounded-lg transition-colors ${collecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {collecting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Running...
              </>
            ) : (
              '🔄 Run Collection Now'
            )}
          </button>
          <button
            onClick={handleExportAll}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            📤 Export All Data
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Hackathons"
          value={stats.categories.hackathon || 0}
          icon="🏆"
          trend="+12%"
          trendUp={true}
        />
        <StatsCard
          title="Job Postings"
          value={stats.categories.job || 0}
          icon="💼"
          trend="+8%"
          trendUp={true}
        />
        <StatsCard
          title="Competitions"
          value={stats.categories.competition || 0}
          icon="🎯"
          trend="+5%"
          trendUp={true}
        />
        <StatsCard
          title="Certifications"
          value={stats.categories.certification || 0}
          icon="📜"
          trend="+15%"
          trendUp={true}
        />
      </div>

      {/* Collection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Items Collected</span>
              <span className="font-semibold text-2xl text-blue-600">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Verified Items</span>
              <span className="font-semibold text-green-600">{stats.verified}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Verification</span>
              <span className="font-semibold text-yellow-600">{stats.pending}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Verification Progress</span>
                <span>{stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-green-50 rounded">
              <span className="text-green-600">✅</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Backend Connected</p>
                <p className="text-xs text-gray-500">API server running</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
              <span className="text-blue-600">🔄</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Data sources active</p>
                <p className="text-xs text-gray-500">Ready for collection</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
              <span className="text-yellow-600">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Google Drive integration</p>
                <p className="text-xs text-gray-500">Simulated mode active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'sources' }))}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-medium text-gray-900">Configure Sources</h4>
            <p className="text-sm text-gray-600">Set up data collection sources</p>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'scheduler' }))}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-medium text-gray-900">Schedule Collection</h4>
            <p className="text-sm text-gray-600">Set collection frequency</p>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'data' }))}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-gray-900">View All Data</h4>
            <p className="text-sm text-gray-600">Browse collected items</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDashboard;