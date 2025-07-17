import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { VIEW_TYPES } from './constants';
import { usePatients } from './hooks/usePatients';
import Navigation from './components/Navigation';
import PatientRegistration from './components/PatientRegistration';
import AdminDashboard from './components/AdminDashboard';
import WaitingRoomDisplay from './components/WaitingRoomDisplay';
import HealthScreeningSystem from './components/screening/HealthScreeningSystem';

const App = () => {
  const [currentView, setCurrentView] = useState(VIEW_TYPES.PATIENT);
  const { patients, calledPatients, loading, error } = usePatients();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Alkalmazás betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Firebase kapcsolat hiba</h2>
          <p className="text-red-600">Kérjük ellenőrizze a Firebase konfigurációt</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case VIEW_TYPES.PATIENT:
        return <PatientRegistration />;
      case VIEW_TYPES.ADMIN:
        return (
          <AdminDashboard 
            patients={patients}
            calledPatients={calledPatients}
          />
        );
      case VIEW_TYPES.DISPLAY:
        return <WaitingRoomDisplay calledPatients={calledPatients} />;
      case VIEW_TYPES.SCREENING:
        return <HealthScreeningSystem />;
      default:
        return <PatientRegistration />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <main className="transition-opacity duration-500">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;