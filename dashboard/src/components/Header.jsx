import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
              <span className="text-white font-bold text-sm">OH</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              OpportunityHub
            </h1>
          </div>
          <span className="hidden md:inline-flex text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
            v1.0.0
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-600">System Active</span>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2"></div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-gray-700">{user?.name || 'Guest'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;