import React, { useState } from 'react';
import { Settings, Clock, AlertCircle, Users } from 'lucide-react';
import { STATIONS, PATIENT_STATUS } from '../constants';
import { firebaseService } from '../services/firebase';

const AdminDashboard = ({ patients, calledPatients }) => {
  // Use first station from STATIONS array as default
  const [selectedStation, setSelectedStation] = useState(STATIONS[0].id);
  
  const patientsArray = Object.entries(patients).map(([id, data]) => ({ id, ...data }));
  const calledArray = Object.entries(calledPatients).map(([id, data]) => ({ id, ...data }));
  
  const stationPatients = patientsArray.filter(p => p.station === selectedStation);
  const waitingPatients = stationPatients.filter(p => p.status === PATIENT_STATUS.WAITING);
  
  // Debug: Log all called patients to see their stations
  console.log('All called patients:', calledArray);
  console.log('Selected station:', selectedStation);
  
  // Fix: Only show called patients for the selected station
  const calledStationPatients = calledArray.filter(p => {
    console.log('Checking called patient:', p.serialNumber, 'station:', p.station, 'matches:', p.station === selectedStation);
    return p.station === selectedStation;
  });

  const callPatient = async (patientId, patientData) => {
    try {
      console.log('Calling patient:', { patientId, patientData, selectedStation });
      
      await firebaseService.updatePatientStatus(patientId, PATIENT_STATUS.CALLED);
      await firebaseService.addCalledPatient({
        serialNumber: patientData.serialNumber,
        station: patientData.station, // Use the patient's original station
        timestamp: patientData.timestamp
      });
      
      console.log('Patient called successfully');
    } catch (error) {
      console.error('Error calling patient:', error);
    }
  };

  const recallPatient = async (serialNumber, calledId) => {
    try {
      console.log('Recalling patient:', { serialNumber, calledId });
      
      // First remove from called patients list
      await firebaseService.removeCalledPatient(calledId);
      
      // Find the original patient by serial number and station
      const originalPatient = patientsArray.find(p => 
        p.serialNumber === serialNumber && 
        p.station === selectedStation
      );
      
      // Then update patient status back to waiting
      if (originalPatient) {
        await firebaseService.updatePatientStatus(originalPatient.id, PATIENT_STATUS.WAITING);
        console.log('Patient recalled successfully');
      } else {
        console.log('Original patient not found, but removed from called list');
      }
    } catch (error) {
      console.error('Error recalling patient:', error);
    }
  };

  const clearAllCalledPatients = async () => {
    try {
      console.log('Clearing all called patients for station:', selectedStation);
      const stationCalled = calledArray.filter(p => p.station === selectedStation);
      
      for (const patient of stationCalled) {
        await firebaseService.removeCalledPatient(patient.id);
      }
      
      console.log('Cleared all called patients');
    } catch (error) {
      console.error('Error clearing called patients:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-500 rounded-full p-3">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Vezérlőpult</h1>
                <p className="text-gray-600">Beteg sor kezelése és hívások</p>
              </div>
            </div>
          </div>

          {/* Updated grid for 10 stations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8 max-h-96 overflow-y-auto">
            {STATIONS.map(station => {
              const Icon = station.icon;
              const count = patientsArray.filter(p => p.station === station.id && p.status === PATIENT_STATUS.WAITING).length;
              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedStation === station.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`${station.color} rounded-full p-2`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-800 text-sm text-center">{station.name}</span>
                    <div className="bg-gray-100 rounded-full px-2 py-1">
                      <span className="text-xs font-medium text-gray-600">{count} várakozik</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Várakozó betegek */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {STATIONS.find(s => s.id === selectedStation)?.name} - Várakozó Sor
              </h3>
              
              {waitingPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nincs várakozó beteg</p>
                </div>
              ) : (
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {waitingPatients.map(patient => (
                    <div key={`waiting-${patient.id}`} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 rounded-full p-2">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Sorszám: {patient.serialNumber}</p>
                            <p className="text-sm text-gray-600">
                              Regisztrálva: {new Date(patient.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => callPatient(patient.id, patient)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                        >
                          Beteg Hívása
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Behívott betegek */}
            <div className="bg-yellow-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {STATIONS.find(s => s.id === selectedStation)?.name} - Behívott Betegek
                </h3>
                {calledStationPatients.length > 0 && (
                  <button
                    onClick={clearAllCalledPatients}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Összes Törlése
                  </button>
                )}
              </div>
              
              {calledStationPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nincs behívott beteg</p>
                </div>
              ) : (
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {calledStationPatients.map(patient => {
                    return (
                      <div key={`called-${patient.id}`} className="bg-white p-4 rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-yellow-100 rounded-full p-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Sorszám: {patient.serialNumber}</p>
                              <p className="text-sm text-gray-600">
                                Behívva: {new Date(patient.calledAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                console.log('Recall clicked:', { 
                                  serialNumber: patient.serialNumber,
                                  calledId: patient.id,
                                  station: selectedStation
                                });
                                recallPatient(patient.serialNumber, patient.id);
                              }}
                              className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors duration-200"
                            >
                              Visszavon
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;