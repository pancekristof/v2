import React from 'react';
import { Monitor, Clock, AlertCircle } from 'lucide-react';
import { STATIONS } from '../constants';

const WaitingRoomDisplay = ({ calledPatients }) => {
  const calledArray = Object.entries(calledPatients).map(([id, data]) => ({ id, ...data }));

  const getCalledPatientsForStation = (stationId) => {
    return calledArray
      .filter(call => call.station === stationId)
      .sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt))
      .slice(0, 4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-8">
            <div className="bg-green-500 rounded-full p-3 w-16 h-16 mx-auto mb-3">
              <Monitor className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Most Hívjuk</h1>
            <p className="text-xl text-gray-600">Kérjük ellenőrizze az állomását alább</p>
          </div>

          {/* Updated grid for 10 stations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {STATIONS.map(station => {
              const Icon = station.icon;
              const stationCalledPatients = getCalledPatientsForStation(station.id);
              
              return (
                <div key={station.id} className="bg-white border-4 border-gray-200 rounded-2xl overflow-hidden shadow-lg min-h-[350px] flex flex-col">
                  <div className={`${station.color} p-4 text-white text-center flex-shrink-0`}>
                    <Icon className="w-12 h-12 mx-auto mb-2" />
                    <h2 className="text-lg font-bold">{station.name}</h2>
                  </div>
                  
                  <div className="flex-1 p-4">
                    {stationCalledPatients.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">Nincs behívott beteg</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700 text-center mb-3">
                          Hívott Betegek
                        </h3>
                        
                        {stationCalledPatients.map((call, index) => (
                          <div key={call.id} 
                               className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                                 index === 0 
                                   ? 'border-red-500 bg-red-50 animate-pulse shadow-lg' 
                                   : 'border-gray-200 bg-gray-50'
                               }`}>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                {index === 0 && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-2xl font-bold ${
                                  index === 0 ? 'text-red-600' : 'text-gray-800'
                                }`}>
                                  {call.serialNumber}
                                </span>
                                {index === 0 && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              
                              {index === 0 ? (
                                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-1">
                                  JÖJJÖN BE MOST
                                </div>
                              ) : (
                                <div className="bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-medium mb-1">
                                  BEFEJEZVE
                                </div>
                              )}
                              
                              <p className={`text-xs ${
                                index === 0 ? 'text-red-600 font-medium' : 'text-gray-600'
                              }`}>
                                {new Date(call.calledAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 text-center bg-blue-50 rounded-xl p-4">
            <p className="text-lg text-blue-800 font-medium">
              📍 Keresse meg a sorszámát a megfelelő állomás oszlopában
            </p>
            <p className="text-base text-blue-600 mt-1">
              Amikor a száma megjelenik a "JÖJJÖN BE MOST" felirattal, menjen az adott állomásra
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomDisplay;