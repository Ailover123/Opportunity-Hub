import React from 'react';
import {
  BarChart3,
  Settings,
  Calendar,
  Database,
  Download,
  CheckCircle,
  Cloud,
  Home
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sources', label: 'Data Sources', icon: Settings },
    { id: 'schedule', label: 'Scheduler', icon: Calendar },
    { id: 'data', label: 'Browse Data', icon: Database },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'drive', label: 'Google Drive', icon: Cloud },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">OpportunityHub</h1>
            <p className="text-xs text-gray-500">Data Collection System</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Version 2.0.0</p>
          <p>Google Drive Integration Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;