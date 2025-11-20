import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, CheckCircle, AlertCircle, Cloud } from 'lucide-react';

const ExportPanel = ({ userId }) => {
  const [selectedCategories, setSelectedCategories] = useState(['hackathon', 'job', 'competition', 'certification']);
  const [format, setFormat] = useState('csv');
  const [uploadToDrive, setUploadToDrive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [isConnectedToDrive, setIsConnectedToDrive] = useState(false);

  useEffect(() => {
    loadExportHistory();
    checkDriveConnection();
  }, [userId]);

  const checkDriveConnection = () => {
    const sessionId = localStorage.getItem('googleDriveSession');
    setIsConnectedToDrive(!!sessionId);
  };

  const loadExportHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/exports/${userId}`);
      const data = await response.json();
      setExportHistory(data);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const exportData = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category to export');
      return;
    }

    setIsExporting(true);

    try {
      const sessionId = localStorage.getItem('googleDriveSession');

      const response = await fetch(`http://localhost:3001/api/export/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: selectedCategories,
          format,
          uploadToDrive: uploadToDrive && sessionId,
          sessionId: sessionId
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Download the file
        const downloadUrl = `http://localhost:3001${result.downloadUrl}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        let message = `Successfully exported ${result.items} items to ${result.filename}`;
        if (result.uploadedToDrive) {
          message += ' and uploaded to Google Drive';
        }

        alert(message);

        // Refresh export history
        loadExportHistory();
      } else {
        alert(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categories = [
    { id: 'hackathon', label: 'Hackathons', color: 'bg-purple-100 text-purple-800' },
    { id: 'job', label: 'Jobs', color: 'bg-blue-100 text-blue-800' },
    { id: 'competition', label: 'Competitions', color: 'bg-green-100 text-green-800' },
    { id: 'certification', label: 'Certifications', color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Download className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Export Data</h2>
      </div>

      {/* Export Configuration */}
      <div className="space-y-6 mb-8">
        {/* Categories Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Categories to Export
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                  {category.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="csv">CSV (Comma Separated Values)</option>
            <option value="xlsx" disabled>Excel (Coming Soon)</option>
            <option value="json" disabled>JSON (Coming Soon)</option>
          </select>
        </div>

        {/* Google Drive Upload Option */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Cloud className={`h-5 w-5 ${isConnectedToDrive ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-gray-900">Upload to Google Drive</p>
              <p className="text-sm text-gray-600">
                {isConnectedToDrive
                  ? 'Automatically save to your OpportunityHub folder'
                  : 'Connect Google Drive first to enable this feature'
                }
              </p>
            </div>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={uploadToDrive}
              onChange={(e) => setUploadToDrive(e.target.checked)}
              disabled={!isConnectedToDrive}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={exportData}
          disabled={isExporting || selectedCategories.length === 0}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {selectedCategories.length} Categories
            </>
          )}
        </button>
      </div>

      {/* Export History */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium">Recent Exports</h3>
        </div>

        {exportHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No exports yet</p>
            <p className="text-sm">Your export history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exportHistory.map((export_item) => (
              <div key={export_item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{export_item.filename}</p>
                    {export_item.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{export_item.items_count} items</span>
                    <span>{formatDate(export_item.created_at)}</span>
                    {export_item.drive_view_link && (
                      <span className="flex items-center text-green-600">
                        <Cloud className="h-3 w-3 mr-1" />
                        Drive
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {export_item.drive_view_link && (
                    <a
                      href={export_item.drive_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Drive
                    </a>
                  )}
                  <a
                    href={`http://localhost:3001/api/download/${export_item.filename}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;