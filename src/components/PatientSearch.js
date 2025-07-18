import React, { useState, useEffect } from 'react';
import { Search, Download, X, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { firebaseService } from '../services/firebase';

const PatientSearch = () => {
  const [screenings, setScreenings] = useState([]);
  const [filteredScreenings, setFilteredScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToScreenings((data) => {
      setScreenings(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filterScreenings = () => {
    let filtered = [...screenings];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(screening => 
        screening.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        screening.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(screening => screening.recommendedClass === classFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(screening => {
            const screeningDate = new Date(screening.timestamp?.seconds * 1000 || screening.timestamp);
            return screeningDate >= filterDate;
          });
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(screening => {
            const screeningDate = new Date(screening.timestamp?.seconds * 1000 || screening.timestamp);
            return screeningDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(screening => {
            const screeningDate = new Date(screening.timestamp?.seconds * 1000 || screening.timestamp);
            return screeningDate >= filterDate;
          });
          break;
        default:
          // No additional filtering for 'all'
          break;
      }
    }

    setFilteredScreenings(filtered);
  };

  useEffect(() => {
    filterScreenings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenings, searchTerm, classFilter, dateFilter]);

  // Validation functions from the original system
  const calculateValidations = (data) => {
    console.log('Raw patient data:', data);
    
    const age = parseInt(data.age);
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height);
    const systolic = parseInt(data.systolic || data.systolicBP);
    const diastolic = parseInt(data.diastolic || data.diastolicBP);
    const pulse = parseInt(data.pulse);
    const oxygen = parseInt(data.oxygen || data.oxygenSaturation);

    console.log('Parsed values:', { age, weight, height, systolic, diastolic, pulse, oxygen });

    // BMI calculation and classification
    const bmi = weight / Math.pow(height / 100, 2);
    let bmiClass = 'white'; // Default
    if (isNaN(bmi)) {
      bmiClass = 'default';
    } else if (bmi < 16) {
      bmiClass = 'piros';
    } else if (bmi < 18.5) {
      bmiClass = 'white';
    } else if (bmi <= 24.99) {
      bmiClass = 'zöld';
    } else if (bmi <= 29.99) {
      bmiClass = 'white';
    } else if (bmi <= 34.99) {
      bmiClass = 'white';  // 31.6 should be white
    } else if (bmi <= 39.99) {
      bmiClass = 'piros';
    } else {
      bmiClass = 'piros';
    }

    console.log('BMI calculation:', { bmi: bmi.toFixed(1), bmiClass });

    // Blood pressure classification
    let bpClass = 'default'; // Default to gray
    if (!isNaN(systolic) && !isNaN(diastolic)) {
      if (systolic >= 110 && systolic <= 130 && diastolic >= 60 && diastolic <= 80) {
        bpClass = 'zöld';
      } else {
        bpClass = 'white'; // 140/70 is outside optimal range, so white
      }
    }

    console.log('Blood pressure calculation:', { systolic, diastolic, bpClass });

    // Oxygen classification
    let oxygenClass = 'default'; // Default to gray
    if (!isNaN(oxygen)) {
      if (oxygen < 93) {
        oxygenClass = 'piros';
      } else if (oxygen <= 94) {
        oxygenClass = 'white';
      } else if (oxygen >= 95 && oxygen <= 100) {
        oxygenClass = 'zöld';
      }
      // 76% should be piros
    }

    console.log('Oxygen calculation:', { oxygen, oxygenClass });

    // Pulse classification
    let pulseClass = 'default'; // Default to gray
    if (!isNaN(pulse)) {
      if (pulse >= 60 && pulse <= 90) {
        pulseClass = 'zöld';
      } else if (pulse >= 50 && pulse <= 59 && age < 55 && bmi < 30) {
        pulseClass = 'zöld';
      } else if (pulse < 50 || pulse > 100) {
        pulseClass = 'piros';
        // 110 bpm should be piros
      } else {
        pulseClass = 'white';
      }
    }

    console.log('Pulse calculation:', { pulse, pulseClass });

    // Disease validations
    const diseaseValidations = {};
    const diseaseKeys = ['magas_vernyomas', 'magas_verzsir', 'cukorbetegseg', 'tudobetegseg', 'erszukuleт', 'szivritmus'];
    
    diseaseKeys.forEach(disease => {
      const hasDisease = data.diseases?.[disease];
      let hasMedication = false;
      
      // Medication connections
      if (disease === 'magas_vernyomas') hasMedication = data.medications?.['magas_vernyomas_gyogyszer'];
      else if (disease === 'magas_verzsir') hasMedication = data.medications?.['magas_verzsir_gyogyszer'];
      else if (disease === 'cukorbetegseg') hasMedication = data.medications?.['cukorbetegseg_tabletta'] || data.medications?.['cukorbetegseg_injeksio'];
      else if (disease === 'tudobetegseg') hasMedication = data.medications?.['tudobetegseg_gyogyszer'];
      else if (disease === 'erszukuleт') hasMedication = data.medications?.['erszukuleт_gyogyszer'];
      else if (disease === 'szivritmus') hasMedication = data.medications?.['szivritmus_gyogyszer'];

      if (!hasDisease) {
        diseaseValidations[disease] = 'zöld';
      } else if (hasDisease && hasMedication) {
        diseaseValidations[disease] = 'sárga';
      } else if (hasDisease && !hasMedication) {
        diseaseValidations[disease] = 'piros';
      }
    });

    // Smoking
    const smokingClass = data.smoking === 'no_smoking' ? 'zöld' : 'sárga';

    const result = {
      bmi: isNaN(bmi) ? 'N/A' : bmi.toFixed(1),
      bmiClass,
      bpClass,
      oxygenClass,
      pulseClass,
      diseaseValidations,
      smokingClass
    };

    // Final debug output
    console.log('Final validation result:', result);

    return result;
  };

  const getClassColor = (classType) => {
    switch (classType) {
      case 'piros': return 'bg-red-100 text-red-800 border-red-200';
      case 'sárga': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'zöld': return 'bg-green-100 text-green-800 border-green-200';
      case 'white': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // White category shows as yellow
      case 'default': return 'bg-gray-100 text-gray-800 border-gray-200'; // Basic data stays gray
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClassLabel = (classType) => {
    switch (classType) {
      case 'piros': return 'Piros Osztály';
      case 'sárga': return 'Sárga Osztály';
      case 'zöld': return 'Zöld Osztály';
      case 'white': return 'Fehér Osztály';
      default: return 'Ismeretlen';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nincs dátum';
    
    let date;
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Érvénytelen dátum';
    }
    
    if (isNaN(date.getTime())) {
      return 'Érvénytelen dátum';
    }
    
    return date.toLocaleDateString('hu-HU') + ' ' + date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBMI = (screening) => {
    if (screening.validations && screening.validations.bmi) {
      return screening.validations.bmi;
    }
    if (screening.weight && screening.height && screening.height > 0) {
      const heightInMeters = screening.height / 100;
      const bmi = screening.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getBloodPressure = (screening) => {
    if (screening.systolic && screening.diastolic) {
      return `${screening.systolic}/${screening.diastolic}`;
    }
    if (screening.systolicBP && screening.diastolicBP) {
      return `${screening.systolicBP}/${screening.diastolicBP}`;
    }
    return 'N/A';
  };

  const getAgeGroup = (age) => {
    if (!age) return 'N/A';
    if (age < 30) return '18-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    return '70+';
  };

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  // Update selected class functionality
  const updateSelectedClass = async (screeningId, newClass) => {
    try {
      // Update in Firebase
      await firebaseService.updateScreeningSelectedClass(screeningId, newClass);
      
      // Update local state
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

  const getRecommendationStats = () => {
    const stats = {
      total: filteredScreenings.length,
      piros: filteredScreenings.filter(s => s.recommendedClass === 'piros').length,
      sárga: filteredScreenings.filter(s => s.recommendedClass === 'sárga').length,
      zöld: filteredScreenings.filter(s => s.recommendedClass === 'zöld').length
    };
    return stats;
  };

  const diseaseLabels = {
    'magas_vernyomas': 'Magas vérnyomás',
    'magas_verzsir': 'Magas vérzsír/koleszterin',
    'cukorbetegseg': 'Cukorbetegség',
    'tudobetegseg': 'Tüdőbetegség',
    'erszukuleт': 'Érszűkület',
    'szivritmus': 'Szívritmus zavar'
  };

  // Render detail item with color coding
  const renderDetailItem = (label, value, validationClass = 'default', icon = null) => {
    return (
      <div className={`detail-item ${getClassColor(validationClass)} rounded-lg p-3 flex justify-between items-center border`}>
        <span className="font-medium flex items-center gap-2">
          {icon}
          <strong>{label}:</strong>
        </span>
        <span className="font-semibold">{value}</span>
      </div>
    );
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

          {/* Statistics */}
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

          {/* Search and filters */}
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
            <div className="flex items-center gap-4">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Minden osztály</option>
                <option value="piros">Piros osztály</option>
                <option value="sárga">Sárga osztály</option>
                <option value="zöld">Zöld osztály</option>
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Minden időszak</option>
                <option value="today">Ma</option>
                <option value="week">Elmúlt hét</option>
                <option value="month">Elmúlt hónap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredScreenings.length > 0 ? (
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
                      BMI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vérnyomás
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ajánlott Osztály
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
                        <span className={`px-2 py-1 rounded text-sm border ${getClassColor(screening.validations?.bmiClass || calculateValidations(screening).bmiClass)}`}>
                          {getBMI(screening)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded text-sm border ${getClassColor(screening.validations?.bpClass || calculateValidations(screening).bpClass)}`}>
                          {getBloodPressure(screening)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getClassColor(screening.recommendedClass)}`}>
                          {getClassLabel(screening.recommendedClass)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(screening.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewPatientDetails(screening)}
                          className="text-teal-600 hover:text-teal-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Részletek
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nincs találat</h3>
              <p className="mt-1 text-sm text-gray-500">
                {screenings.length === 0 
                  ? 'Még nincsenek rögzített szűrési adatok.'
                  : 'Próbálja meg módosítani a keresési feltételeket.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Modal with Color Validation */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
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
              {(() => {
                const validations = selectedPatient.validations || calculateValidations(selectedPatient);
                
                return (
                  <div className="space-y-6">
                    {/* Patient risk assessment banner */}
                    <div className={`p-4 rounded-lg border-l-4 ${
                      selectedPatient.recommendedClass === 'piros' 
                        ? 'bg-red-50 border-red-400' 
                        : selectedPatient.recommendedClass === 'sárga' 
                        ? 'bg-yellow-50 border-yellow-400' 
                        : 'bg-green-50 border-green-400'
                    }`}>
                      <div className="flex items-center">
                        {selectedPatient.recommendedClass === 'piros' ? (
                          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        )}
                        <h4 className="font-medium">
                          Páciens besorolása: <span className="font-bold">{getClassLabel(selectedPatient.recommendedClass)}</span>
                        </h4>
                      </div>
                      {selectedPatient.recommendedClass === 'piros' && (
                        <p className="mt-1 text-sm text-red-700">
                          Sürgős orvosi konzultáció szükséges!
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Data */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Alapadatok</h3>
                        <div className="space-y-3">
                          {renderDetailItem('Név', selectedPatient.name || 'N/A', 'gray')}
                          {renderDetailItem('Sorszám', selectedPatient.serialNumber || 'N/A', 'gray')}
                          {renderDetailItem('Kor', `${selectedPatient.age || 'N/A'} éves`, 'gray')}
                          {renderDetailItem('Korcsoport', getAgeGroup(selectedPatient.age), 'gray')}
                          {renderDetailItem('Nem', selectedPatient.gender === 'male' ? 'Férfi' : 'Nő', 'gray')}
                          {renderDetailItem('Irányítószám', selectedPatient.postalCode || 'N/A', 'gray')}
                        </div>
                      </div>

                      {/* Measurements with color coding */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Mérési eredmények</h3>
                        <div className="space-y-3">
                          {renderDetailItem('Magasság', `${selectedPatient.height || 'N/A'} cm`)} {/* Default gray */}
                          {renderDetailItem('Súly', `${selectedPatient.weight || 'N/A'} kg`)} {/* Default gray */}
                          {renderDetailItem('BMI', getBMI(selectedPatient), validations.bmiClass)} {/* Validation color */}
                          {renderDetailItem('Vérnyomás', getBloodPressure(selectedPatient), validations.bpClass)} {/* Validation color */}
                          {renderDetailItem('Oxigén telítettség', 
                            selectedPatient.oxygenSaturation ? `${selectedPatient.oxygenSaturation}%` : 
                            (selectedPatient.oxygen ? `${selectedPatient.oxygen}%` : 'N/A'), 
                            validations.oxygenClass
                          )} {/* Validation color */}
                          {renderDetailItem('Pulzus', 
                            selectedPatient.pulse ? `${selectedPatient.pulse} bpm` : 'N/A', 
                            validations.pulseClass
                          )} {/* Validation color */}
                          {renderDetailItem('Dohányzás', 
                            selectedPatient.smoking === 'no_smoking' ? 'Nem dohányzik' : 'Dohányzik', 
                            validations.smokingClass
                          )} {/* Validation color */}
                        </div>
                      </div>
                    </div>

                    {/* Diseases with color coding */}
                    {selectedPatient.diseases && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Betegségek</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(diseaseLabels).map(([diseaseKey, diseaseLabel]) => {
                            const hasDisease = selectedPatient.diseases[diseaseKey];
                            const validationClass = validations.diseaseValidations[diseaseKey];
                            const status = hasDisease 
                              ? (validationClass === 'sárga' ? 'Van (gyógyszerrel)' : 'Van (gyógyszer nélkül)')
                              : 'Nincs';
                            
                            return (
                              <div key={diseaseKey}>
                                {renderDetailItem(diseaseLabel, status, validationClass)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {selectedPatient.medications && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Gyógyszerek</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(selectedPatient.medications).map(([medication, takesIt]) => (
                            takesIt && (
                              <div key={medication} className="flex items-center space-x-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="capitalize text-sm">{medication.replace(/_/g, ' ')}</span>
                              </div>
                            )
                          ))}
                          {!Object.values(selectedPatient.medications).some(Boolean) && (
                            <div className="text-gray-500 italic">Nincs gyógyszer rögzítve</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Class information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recommended class */}
                      <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900 mb-2">Ajánlott osztály</div>
                          <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full border-2 ${getClassColor(selectedPatient.recommendedClass)}`}>
                            {getClassLabel(selectedPatient.recommendedClass)}
                          </span>
                        </div>
                      </div>

                      {/* Selected class */}
                      <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900 mb-2">Választott osztály</div>
                          <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full border-2 ${getClassColor(selectedPatient.selectedClass || selectedPatient.recommendedClass)}`}>
                            {getClassLabel(selectedPatient.selectedClass || selectedPatient.recommendedClass)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedPatient.notes && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="text-lg font-semibold text-gray-900 mb-2">Megjegyzések</div>
                        <div className="text-gray-700">{selectedPatient.notes}</div>
                      </div>
                    )}

                    {/* Color legend */}
                                          <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-900 mb-3">Színkód magyarázat:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                          <span className="text-sm"><strong>Zöld:</strong> Normális / Nincs betegség</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                          <span className="text-sm"><strong>Sárga:</strong> Közepes kockázat / Figyelmeztetés</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                          <span className="text-sm"><strong>Piros:</strong> Magas kockázat / Kritikus</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                          <span className="text-sm"><strong>Szürke:</strong> Alapadatok</span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-center text-sm text-gray-500 pt-4 border-t">
                      Rögzítve: {formatDate(selectedPatient.timestamp)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;