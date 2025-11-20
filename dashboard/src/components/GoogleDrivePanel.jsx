import React, { useState, useEffect } from 'react';
import { CheckCircle, Cloud, ExternalLink, AlertCircle, Loader } from 'lucide-react';

const GoogleDrivePanel = ({ userId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already connected
    const savedSessionId = localStorage.getItem('googleDriveSession');
    if (savedSessionId) {
      checkAuthStatus(savedSessionId);
    }
  }, []);

  const checkAuthStatus = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/status/${sessionId}`);
      const data = await response.json();

      if (data.authenticated) {
        setIsConnected(true);
        setUser(data.user);
        setSessionId(sessionId);
        localStorage.setItem('googleDriveSession', sessionId);
        loadFiles(sessionId);
      } else {
        localStorage.removeItem('googleDriveSession');
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  };

  const connectGoogleDrive = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/auth/google');
      const data = await response.json();

      if (data.authUrl) {
        // Open OAuth URL in new window
        const authWindow = window.open(
          data.authUrl,
          'googleAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for auth completion
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // Check if auth was successful
            setTimeout(() => {
              const savedSessionId = localStorage.getItem('googleDriveSession');
              if (savedSessionId) {
                checkAuthStatus(savedSessionId);
              }
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      setError('Failed to initiate Google Drive connection');
      console.error('Connect error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/drive/files/${sessionId}`);
      const data = await response.json();

      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const disconnect = async () => {
    try {
      if (sessionId) {
        await fetch(`http://localhost:3001/api/auth/disconnect/${sessionId}`, {
          method: 'POST'
        });
      }

      setIsConnected(false);
      setUser(null);
      setSessionId(null);
      setFiles([]);
      localStorage.removeItem('googleDriveSession');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Google Drive Integration</h2>
        </div>

        {isConnected && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-8">
          <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect to Google Drive
          </h3>
          <p className="text-gray-600 mb-6">
            Automatically save your exported CSV files to Google Drive for easy access and sharing.
          </p>

          <button
            onClick={connectGoogleDrive}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Connect Google Drive
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-gray-500">
            <p>• Secure OAuth 2.0 authentication</p>
            <p>• Files saved to OpportunityHub folder</p>
            <p>• You can disconnect anytime</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Connected User Info */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-green-900">{user?.name}</p>
                <p className="text-sm text-green-700">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={disconnect}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Disconnect
            </button>
          </div>

          {/* Files List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Exports</h3>
              <button
                onClick={() => loadFiles(sessionId)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No files uploaded yet</p>
                <p className="text-sm">Export data with "Upload to Drive" enabled to see files here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(file.createdTime)} • {formatFileSize(file.size)}
                      </p>
                    </div>

                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDrivePanel;