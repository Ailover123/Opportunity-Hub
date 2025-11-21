import React, { useState } from 'react';
import { getAllMockData } from '../data/mockCollectedData';

const ValidationPanel = () => {
  const [validationRules, setValidationRules] = useState({
    duplicateCheck: true,
    urlValidation: true,
    dateValidation: true,
    contentQuality: true,
    sourceReliability: true
  });

  const [validationResults, setValidationResults] = useState([
    { id: 1, type: 'duplicate', message: 'Duplicate entry found: "AI Innovation Challenge 2024"', severity: 'warning', resolved: false },
    { id: 2, type: 'url', message: 'Invalid URL detected in job posting', severity: 'error', resolved: true },
    { id: 3, type: 'date', message: 'Deadline date is in the past for hackathon entry', severity: 'warning', resolved: false },
    { id: 4, type: 'content', message: 'Low quality content detected - missing description', severity: 'info', resolved: false },
  ]);

  const data = getAllMockData();
  const stats = {
    total: data.length,
    verified: data.filter(item => item.status === 'verified').length,
    pending: data.filter(item => item.status === 'pending').length,
    duplicates: validationResults.filter(r => r.type === 'duplicate' && !r.resolved).length,
    errors: validationResults.filter(r => r.severity === 'error' && !r.resolved).length
  };

  const handleRuleToggle = (rule) => {
    setValidationRules(prev => ({
      ...prev,
      [rule]: !prev[rule]
    }));
  };

  const handleResolveIssue = (id) => {
    setValidationResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, resolved: true } : result
      )
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'duplicate': return '🔄';
      case 'url': return '🔗';
      case 'date': return '📅';
      case 'content': return '📝';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Validation & Quality Control</h2>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            🔍 Run Full Validation
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            ✅ Auto-Fix Issues
          </button>
        </div>
      </div>

      {/* Validation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.duplicates}</div>
          <div className="text-sm text-gray-600">Duplicates</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>

      {/* Validation Rules */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Rules Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'duplicateCheck', label: 'Duplicate Detection', desc: 'Check for duplicate entries across all data' },
            { key: 'urlValidation', label: 'URL Validation', desc: 'Verify all URLs are accessible and valid' },
            { key: 'dateValidation', label: 'Date Validation', desc: 'Check deadline dates are in the future' },
            { key: 'contentQuality', label: 'Content Quality', desc: 'Assess completeness and quality of content' },
            { key: 'sourceReliability', label: 'Source Reliability', desc: 'Verify source authenticity and reputation' }
          ].map(rule => (
            <div key={rule.key} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{rule.label}</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validationRules[rule.key]}
                    onChange={() => handleRuleToggle(rule.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Validation Issues</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {validationResults.filter(result => !result.resolved).map((result) => (
            <div key={result.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{getTypeIcon(result.type)}</span>
                <div>
                  <p className="font-medium text-gray-900">{result.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(result.severity)}`}>
                      {result.severity}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">{result.type} validation</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleResolveIssue(result.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  ✅ Resolve
                </button>
                <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors">
                  👁️ View Details
                </button>
              </div>
            </div>
          ))}

          {validationResults.filter(result => !result.resolved).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-medium">All validation checks passed!</p>
              <p className="text-sm">No issues found in the current dataset.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolved Issues */}
      {validationResults.filter(result => result.resolved).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Resolved Issues</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {validationResults.filter(result => result.resolved).map((result) => (
              <div key={result.id} className="p-6 flex items-center justify-between opacity-60">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getTypeIcon(result.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900 line-through">{result.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Resolved
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{result.type} validation</span>
                    </div>
                  </div>
                </div>
                <div className="text-green-600 text-xl">✅</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;