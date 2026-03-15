import React, { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import ApiService from '../services/api';
import { useToast } from '../context/ToastContext';
import AreaChartComponent from './charts/AreaChart';
import BarChartComponent from './charts/BarChart';
import PieChartComponent from './charts/PieChart';

const DataDashboard = ({ userId, setActiveView, collecting, setCollecting }) => {
  const { success, error: showError } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    categories: {},
    charts: { area: [], bar: [], pie: [] }
  });
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDashboardStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showError('Failed to load dashboard data');
      setStats({
        total: 0, verified: 0, pending: 0, categories: {},
        charts: { area: [], bar: [], pie: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunCollection = async () => {
    try {
      if (!keywords.trim()) {
        showError('Please enter at least one keyword');
        return;
      }
      setCollecting(true);
      // Start collection
      await ApiService.runDataCollection(userId, { keywords: keywords });
      success('Collection started! Monitoring progress...');
    } catch (error) {
      console.error('Collection failed to start:', error);
      showError('Data collection failed to start.');
      setCollecting(false); // Stop if start failed
    }
  };

  // Poll for logs
  useEffect(() => {
    let interval;
    if (collecting) {
      interval = setInterval(async () => {
        try {
          const status = await ApiService.getCollectionStatus(userId);
          setLogs(status.logs || []);
          if (status.status === 'completed' || status.status === 'failed') {
            setCollecting(false);
            if (status.status === 'completed') success(`Collection finished! Collected ${status.collected} new items.`);
            else showError('Collection failed check logs.');
            loadDashboardData();
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [collecting, userId]);

  const [logs, setLogs] = useState([]);

  const handleExportAll = async () => {
    try {
      const result = await ApiService.exportData(userId, {
        categories: ['hackathon', 'job', 'competition', 'certification'],
        format: 'csv'
      });

      if (result.success) {
        success(`Export completed! ${result.items} items exported.`);
        // Auto-download the file
        ApiService.downloadFile(result.filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      showError('Export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Collection Dashboard</h2>
          <p className="text-gray-500 text-sm">Real-time opportunity scraping</p>
        </div>

        <div className="flex flex-1 max-w-xl space-x-2 w-full">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleRunCollection}
            disabled={collecting}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center ${collecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {collecting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Scraping...
              </>
            ) : (
              '🚀 Start Scraping'
            )}
          </button>
        </div>

        <div>
          <button
            onClick={handleExportAll}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            📤 Export
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Activity (7 Days)</h3>
          <AreaChartComponent data={stats.charts?.area || []} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Distribution</h3>
          <PieChartComponent data={stats.charts?.pie || []} />
        </div>
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
            <div className={`flex items-center space-x-3 p-2 rounded ${localStorage.getItem('googleDriveSession') ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <span className={localStorage.getItem('googleDriveSession') ? 'text-green-600' : 'text-yellow-600'}>
                {localStorage.getItem('googleDriveSession') ? '✅' : '⚠️'}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Google Drive integration</p>
                <p className="text-xs text-gray-500">
                  {localStorage.getItem('googleDriveSession') ? 'Connected & Ready' : 'Not setup / Disconnected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Logs Section */}
      {logs.length > 0 && (
        <div className="bg-black text-green-400 p-4 rounded-lg shadow-sm font-mono text-sm h-64 overflow-y-auto">
          <h3 className="text-white font-bold mb-2 border-b border-gray-700 pb-1">⚡ Live Collection Logs</h3>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            {collecting && <div className="animate-pulse">_</div>}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveView('sources')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-medium text-gray-900">Configure Sources</h4>
            <p className="text-sm text-gray-600">Set up data collection sources</p>
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-medium text-gray-900">Schedule Collection</h4>
            <p className="text-sm text-gray-600">Set collection frequency</p>
          </button>
          <button
            onClick={() => setActiveView('data')}
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