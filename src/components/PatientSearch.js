import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, FileText, Filter, Download, Eye, X } from 'lucide-react';
import { firebaseService } from '../services/firebase';

const PatientSearch = () => {
  const [screenings, setScreenings] = useState([]);
  const [filteredScreenings, setFilteredScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToScreenings((data) => {
      setScreenings(data);
      setFilteredScreenings(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    let filtered = screenings;

    // Név és sorszám alapján keresés
    if (searchTerm) {
      filtered = filtered.filter(screening =>
        screening.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screening.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ajánlott osztály alapján szűrés
    if (selectedRecommendation !== 'all') {
      filtered = filtered.filter(screening =>
        screening.recommendedClass === selectedRecommendation
      );
    }

    setFilteredScreenings(filtered);
  }, [searchTerm, selectedRecommendation, screenings]);

  const getClassColor = (classType) => {
    switch (classType) {
      case 'piros': return 'bg-red-100 text-red-800 border-red-200';
      case 'sárga': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'zöld': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClassLabel = (classType) => {
    switch (classType) {
      case 'piros': return 'Piros Osztály';
      case 'sárga': return 'Sárga Osztály';
      case 'zöld': return 'Zöld Osztály';
      default: return 'Ismeretlen';
    }
  };

  // Javított időpont formázás
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nincs dátum';
    
    let date;
    
    // Firebase timestamp objektum kezelése
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } 
    // String vagy number timestamp
    else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Érvénytelen dátum';
    }
    
    // Ellenőrizzük, hogy érvényes-e a dátum
    if (isNaN(date.getTime())) {
      return 'Érvénytelen dátum';
    }
    
    return date.toLocaleDateString('hu-HU') + ' ' + date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Javított BMI számítás vagy validations-ból olvasás
  const getBMI = (screening) => {
    // Először próbáljuk a validations objektumból
    if (screening.validations && screening.validations.bmi) {
      return screening.validations.bmi;
    }
    // Ha nincs, számoljuk ki
    if (screening.weight && screening.height && screening.height > 0) {
      const heightInMeters = screening.height / 100;
      const bmi = screening.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  // Vérnyomás formázás
  const getBloodPressure = (screening) => {
    if (screening.systolic && screening.diastolic) {
      return `${screening.systolic}/${screening.diastolic}`;
    }
    if (screening.systolicBP && screening.diastolicBP) {
      return `${screening.systolicBP}/${screening.diastolicBP}`;
    }
    return 'N/A';
  };

  // Korcsoport meghatározás
  const getAgeGroup = (age) => {
    if (!age) return 'N/A';
    if (age < 30) return '18-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    return '70+';
  };

  const exportToCSV = () => {
    const headers = [
      'Sorszám', 'Név', 'Kor', 'Korcsoport', 'Nem', 'BMI', 'Vérnyomás', 
      'Oxigén', 'Pulzus', 'Ajánlott Osztály', 'Választott Osztály', 'Időpont'
    ];
    
    const csvData = filteredScreenings.map(screening => [
      screening.serialNumber || '',
      screening.name || '',
      screening.age || '',
      getAgeGroup(screening.age),
      screening.gender === 'male' ? 'Férfi' : 'Nő',
      getBMI(screening),
      getBloodPressure(screening),
      screening.oxygenSaturation ? `${screening.oxygenSaturation}%` : (screening.oxygen ? `${screening.oxygen}%` : ''),
      screening.pulse ? `${screening.pulse} bpm` : '',
      getClassLabel(screening.recommendedClass),
      getClassLabel(screening.selectedClass || screening.recommendedClass),
      formatDate(screening.timestamp)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beteg_szuresek_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  // Választott osztály frissítése
  const updateSelectedClass = async (screeningId, newClass) => {
    try {
      // Frissítjük a Firebase-ben
      await firebaseService.updateScreeningSelectedClass(screeningId, newClass);
      
      // Helyi state frissítése
      setScreenings(prev => prev.map(screening => 
        screening.id === screeningId 
          ? { ...screening, selectedClass: newClass }
          : screening
      ));
      
      setFilteredScreenings(prev => prev.map(screening => 
        screening.id === screeningId 
          ? { ...screening, selectedClass: newClass }
          : screening
      ));
      
    } catch (error) {
      console.error('Hiba a választott osztály frissítésekor:', error);
      alert('Hiba történt a választott osztály mentésekor!');
    }
  };

  const getRecommendationStats = () => {
    const stats = {
      total: filteredScreenings.length,
      piros: filteredScreenings.filter(s => s.recommendedClass === 'piros').length,
      sárga: filteredScreenings.filter(s => s.recommendedClass === 'sárga').length,
      zöld: filteredScreenings.filter(s => s.recommendedClass === 'zöld').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Betegadatok betöltése...</p>
        </div>
      </div>
    );
  }

  const stats = getRecommendationStats();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Search className="w-8 h-8 text-teal-500" />
              <h1 className="text-2xl font-bold text-gray-900">Szűrési Eredmények Elemzése</h1>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV Export</span>
            </button>
          </div>

          {/* Statisztikák */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700">Összes</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.piros}</div>
              <div className="text-sm text-red-700">Piros Osztály</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.sárga}</div>
              <div className="text-sm text-yellow-700">Sárga Osztály</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.zöld}</div>
              <div className="text-sm text-green-700">Zöld Osztály</div>
            </div>
          </div>

          {/* Keresés és szűrők */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Keresés név vagy sorszám alapján..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedRecommendation}
                onChange={(e) => setSelectedRecommendation(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">Minden osztály</option>
                <option value="piros">Piros Osztály</option>
                <option value="sárga">Sárga Osztály</option>
                <option value="zöld">Zöld Osztály</option>
              </select>
            </div>
          </div>
        </div>

        {/* Betegek táblázata */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sorszám
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Név
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BMI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vérnyomás
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ajánlott Osztály
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Választott Osztály
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Időpont
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScreenings.map((screening) => (
                  <tr key={screening.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {screening.serialNumber || 'Nincs'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {screening.name || 'Név nélkül'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {screening.age || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {screening.gender === 'male' ? 'Férfi' : 'Nő'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBMI(screening)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBloodPressure(screening)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getClassColor(screening.recommendedClass)}`}>
                        {getClassLabel(screening.recommendedClass)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={screening.selectedClass || screening.recommendedClass}
                        onChange={(e) => updateSelectedClass(screening.id, e.target.value)}
                        className={`text-xs font-semibold rounded border px-2 py-1 ${getClassColor(screening.selectedClass || screening.recommendedClass)}`}
                      >
                        <option value="piros">Piros Osztály</option>
                        <option value="sárga">Sárga Osztály</option>
                        <option value="zöld">Zöld Osztály</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(screening.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewPatientDetails(screening)}
                        className="text-teal-600 hover:text-teal-900 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Részletek</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredScreenings.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nincs találat</h3>
              <p className="text-gray-500">
                {searchTerm || selectedRecommendation !== 'all' 
                  ? 'Próbálja meg módosítani a keresési feltételeket.'
                  : 'Még nincsenek rögzített szűrési adatok.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal a beteg részletes adataihoz */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Beteg részletes adatai - {selectedPatient.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Alapadatok */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Alapadatok</h3>
                  <div className="space-y-2">
                    <div><strong>Név:</strong> {selectedPatient.name || 'N/A'}</div>
                    <div><strong>Sorszám:</strong> {selectedPatient.serialNumber || 'N/A'}</div>
                    <div><strong>Kor:</strong> {selectedPatient.age || 'N/A'} éves</div>
                    <div><strong>Korcsoport:</strong> {getAgeGroup(selectedPatient.age)}</div>
                    <div><strong>Nem:</strong> {selectedPatient.gender === 'male' ? 'Férfi' : 'Nő'}</div>
                    <div><strong>Irányítószám:</strong> {selectedPatient.postalCode || 'N/A'}</div>
                    <div><strong>Magasság:</strong> {selectedPatient.height || 'N/A'} cm</div>
                    <div><strong>Súly:</strong> {selectedPatient.weight || 'N/A'} kg</div>
                    <div><strong>BMI:</strong> {getBMI(selectedPatient)}</div>
                  </div>
                </div>

                {/* Mérési eredmények */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Mérési eredmények</h3>
                  <div className="space-y-2">
                    <div><strong>Vérnyomás:</strong> {getBloodPressure(selectedPatient)}</div>
                    <div><strong>Oxigén telítettség:</strong> {
                      selectedPatient.oxygenSaturation ? `${selectedPatient.oxygenSaturation}%` : 
                      (selectedPatient.oxygen ? `${selectedPatient.oxygen}%` : 'N/A')
                    }</div>
                    <div><strong>Pulzus:</strong> {selectedPatient.pulse ? `${selectedPatient.pulse} bpm` : 'N/A'}</div>
                    <div><strong>Dohányzás:</strong> {selectedPatient.smoking === 'no_smoking' ? 'Nem dohányzik' : 'Dohányzik'}</div>
                  </div>
                </div>

                {/* Betegségek */}
                {selectedPatient.diseases && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Betegségek</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedPatient.diseases).map(([disease, hasDisease]) => (
                        hasDisease && (
                          <div key={disease} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="capitalize">{disease.replace(/_/g, ' ')}</span>
                          </div>
                        )
                      ))}
                      {!Object.values(selectedPatient.diseases).some(Boolean) && (
                        <div className="text-gray-500">Nincs betegség rögzítve</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gyógyszerek */}
                {selectedPatient.medications && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Gyógyszerek</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedPatient.medications).map(([medication, takesIt]) => (
                        takesIt && (
                          <div key={medication} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="capitalize">{medication.replace(/_/g, ' ')}</span>
                          </div>
                        )
                      ))}
                      {!Object.values(selectedPatient.medications).some(Boolean) && (
                        <div className="text-gray-500">Nincs gyógyszer rögzítve</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Osztály információk */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ajánlott osztály */}
                <div className="p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-2">Ajánlott osztály</div>
                    <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full border-2 ${getClassColor(selectedPatient.recommendedClass)}`}>
                      {getClassLabel(selectedPatient.recommendedClass)}
                    </span>
                  </div>
                </div>

                {/* Választott osztály */}
                <div className="p-4 rounded-lg border-2 border-dashed border-blue-300">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-2">Választott osztály</div>
                    <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full border-2 ${getClassColor(selectedPatient.selectedClass || selectedPatient.recommendedClass)}`}>
                      {getClassLabel(selectedPatient.selectedClass || selectedPatient.recommendedClass)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Megjegyzések ha vannak */}
              {selectedPatient.notes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 mb-2">Megjegyzések</div>
                  <div className="text-gray-700">{selectedPatient.notes}</div>
                </div>
              )}

              {/* Időpont */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Rögzítve: {formatDate(selectedPatient.timestamp)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;