import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DataDashboard from './components/DataDashboard';
import DataSourceConfig from './components/DataSourceConfig';
import CollectionScheduler from './components/CollectionScheduler';
import DataTable from './components/DataTable';
import ExportPanel from './components/ExportPanel';
import ValidationPanel from './components/ValidationPanel';
import GoogleDrivePanel from './components/GoogleDrivePanel';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const userId = 'demo-user-123'; // In production, this would come from authentication

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DataDashboard userId={userId} />;
      case 'sources':
        return <DataSourceConfig userId={userId} />;
      case 'schedule':
        return <CollectionScheduler userId={userId} />;
      case 'data':
        return <DataTable userId={userId} />;
      case 'export':
        return <ExportPanel userId={userId} />;
      case 'validation':
        return <ValidationPanel userId={userId} />;
      case 'drive':
        return <GoogleDrivePanel userId={userId} />;
      default:
        return <DataDashboard userId={userId} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;