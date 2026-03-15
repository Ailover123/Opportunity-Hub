import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ApiService from '../services/api';

const CollectionScheduler = ({ userId, collecting, setCollecting }) => {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [schedule, setSchedule] = useState({
    frequency: 'daily',
    time: '09:00',
    timezone: 'UTC',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mock history for now - in production this would come from a real logs table
  const [scheduleHistory] = useState([
    { id: 1, date: '2024-12-09', time: '09:00', status: 'completed', items: 15 },
    { id: 2, date: '2024-12-08', time: '09:00', status: 'completed', items: 12 },
  ]);

  useEffect(() => {
    if (user?.id) {
      loadSchedule();
    }
  }, [user]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getSchedule(user.id);
      if (data) {
        setSchedule({
          frequency: data.frequency || 'daily',
          time: data.time || '09:00',
          timezone: data.timezone || 'UTC',
          enabled: !!data.enabled
        });
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ApiService.saveSchedule(user.id, schedule);
      success('Schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      showError('Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    if (collecting) return;
    if (!confirm('Run data collection immediately?')) return;
    try {
      setCollecting(true);
      const result = await ApiService.runDataCollection(userId || user.id);
      success(`Collection completed! Collected ${result.collected} items.`);
    } catch (error) {
      showError('Failed to start collection: ' + error.message);
    } finally {
      setCollecting(false);
    }
  };

  const handleScheduleChange = (field, value) => {
    setSchedule(prev => ({ ...prev, [field]: value }));
  };

  const getNextRunTime = () => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':');
    const nextRun = new Date();
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toLocaleString();
  };

  if (loading) return <div className="p-6">Loading scheduler...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Collection Scheduler</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : '💾 Save Schedule'}
        </button>
      </div>

      {/* Schedule Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collection Frequency</label>
            <select
              value={schedule.frequency}
              onChange={(e) => handleScheduleChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collection Time</label>
            <input
              type="time"
              value={schedule.time}
              onChange={(e) => handleScheduleChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={schedule.timezone}
              onChange={(e) => handleScheduleChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Automatic Collection</h4>
            <p className="text-sm text-gray-600">
              Next run: {schedule.enabled ? getNextRunTime() : 'Disabled'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => handleScheduleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Schedule Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Schedule Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {schedule.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Frequency</span>
              <span className="font-medium capitalize">{schedule.frequency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Collection Time</span>
              <span className="font-medium">{schedule.time}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleRunNow}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Run Collection Now
            </button>
            <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              📊 View Logs
            </button>
          </div>
        </div>
      </div>

      {/* Schedule History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Collection History (Mock)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Collected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduleHistory.map((run) => (
                <tr key={run.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{run.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{run.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${run.status === 'completed' ? 'bg-green-100 text-green-800' :
                      run.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{run.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionScheduler;