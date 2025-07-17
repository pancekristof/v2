import React from 'react';
import { Users, Settings, Monitor, FileText } from 'lucide-react';
import { VIEW_TYPES } from '../constants';

const Navigation = ({ currentView, setCurrentView }) => {
  const navItems = [
    {
      id: VIEW_TYPES.PATIENT,
      label: 'Páciens Regisztráció',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: VIEW_TYPES.ADMIN,
      label: 'Váróterem Admin',
      icon: Settings,
      color: 'bg-indigo-500'
    },
    {
      id: VIEW_TYPES.DISPLAY,
      label: 'Váróterem Kijelző',
      icon: Monitor,
      color: 'bg-green-500'
    },
    {
      id: VIEW_TYPES.SCREENING,
      label: 'Egészségügyi Szűrés',
      icon: FileText,
      color: 'bg-purple-500'
    }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Egészségügyi Rendszer</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? `${item.color} text-white`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;