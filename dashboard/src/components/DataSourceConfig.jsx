import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useToast } from '../context/ToastContext';

const DataSourceConfig = ({ userId }) => {
  const { success, error: showError } = useToast();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'hackathon'
  });

  useEffect(() => {
    if (userId) {
      loadSources();
    }
  }, [userId]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDataSources(userId);
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (newSource.name && newSource.url) {
      try {
        const sourceToAdd = {
          ...newSource,
          active: true
        };
        // Optimistic update or wait for reload? Let's reload to be safe or append if API returns id
        await ApiService.addDataSource(userId, sourceToAdd);
        setNewSource({ name: '', url: '', type: 'hackathon' });
        loadSources();
        success('Source added successfully');
      } catch (error) {
        console.error('Failed to add source:', error);
        showError('Failed to add source');
      }
    }
  };

  const toggleSource = async (id) => {
    const source = sources.find(s => s.id === id);
    if (!source) return;

    // Optimistic update
    const newActiveState = !source.active;
    setSources(sources.map(s => s.id === id ? { ...s, active: newActiveState } : s));

    try {
      await ApiService.toggleDataSource(userId, id, newActiveState);
    } catch (e) {
      console.error('Failed to toggle source:', e);
      // Revert
      setSources(sources.map(s => s.id === id ? { ...s, active: source.active } : s));
      showError('Failed to update source');
    }
  };

  const removeSource = async (id) => {
    if (!window.confirm('Remove this source?')) return;

    const oldSources = [...sources];
    setSources(sources.filter(source => source.id !== id));

    try {
      await ApiService.deleteDataSource(userId, id);
      success('Source removed');
    } catch (e) {
      console.error(e);
      setSources(oldSources);
      showError('Failed to remove source');
    }
  };

  if (loading) return <div className="p-6">Loading sources...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Sources Configuration</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          💾 Save Configuration
        </button>
      </div>

      {/* Add New Source */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Data Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Source Name"
            value={newSource.name}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="url"
            placeholder="Source URL"
            value={newSource.url}
            onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newSource.type}
            onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hackathon">Hackathon</option>
            <option value="job">Job Posting</option>
            <option value="competition">Competition</option>
            <option value="certification">Certification</option>
          </select>
          <button
            onClick={handleAddSource}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Source
          </button>
        </div>
      </div>

      {/* Existing Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configured Data Sources</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sources.map((source) => (
            <div key={source.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${source.active ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <p className="text-sm text-gray-500">{source.url}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${source.type === 'hackathon' ? 'bg-purple-100 text-purple-800' :
                    source.type === 'job' ? 'bg-blue-100 text-blue-800' :
                      source.type === 'competition' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {source.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleSource(source.id)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${source.active
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                >
                  {source.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => removeSource(source.id)}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Source Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{sources.filter(s => s.type === 'hackathon' && s.active).length}</div>
          <div className="text-sm text-gray-600">Active Hackathon Sources</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{sources.filter(s => s.type === 'job' && s.active).length}</div>
          <div className="text-sm text-gray-600">Active Job Sources</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{sources.filter(s => s.type === 'competition' && s.active).length}</div>
          <div className="text-sm text-gray-600">Active Competition Sources</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{sources.filter(s => s.type === 'certification' && s.active).length}</div>
          <div className="text-sm text-gray-600">Active Certification Sources</div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceConfig;