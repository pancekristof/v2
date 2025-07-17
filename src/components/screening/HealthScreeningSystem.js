import React, { useState, useEffect } from 'react';
import { User, Heart, Pill, FileText, BarChart3, Download, Search } from 'lucide-react';
import { firebaseService } from '../../services/firebase';

const HealthScreeningSystem = () => {
  const [currentView, setCurrentView] = useState('form');
  const [formData, setFormData] = useState({
    // Személyes adatok
    name: '',
    postalCode: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    systolic: '',
    diastolic: '',
    pulse: '',
    oxygen: '',
    notes: '',
    
    // Betegségek
    diseases: {
      'magas_vernyomas': null,
      'magas_verzsir': null,
      'cukorbetegseg': null,
      'tudobetegseg': null,
      'erszukuleт': null,
      'szivritmus': null
    },
    
    // Gyógyszerek
    medications: {
      'magas_vernyomas_gyogyszer': null,
      'magas_verzsir_gyogyszer': null,
      'cukorbetegseg_tabletta': null,
      'cukorbetegseg_injeksio': null,
      'tudobetegseg_gyogyszer': null,
      'erszukuleт_gyogyszer': null,
      'szivritmus_gyogyszer': null
    },
    
    // Dohányzás
    smoking: ''
  });

  // Firebase state management
  const [submissions, setSubmissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [nextSerialNumber, setNextSerialNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  // Firebase listener for real-time updates
  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToScreenings((screenings) => {
      setSubmissions(screenings);
      
      // Update next serial number based on existing submissions
      if (screenings.length > 0) {
        const maxSerial = Math.max(...screenings.map(s => {
          const match = s.serialNumber?.match(/S7\/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }));
        setNextSerialNumber(maxSerial + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  // Automatikus sorszám generálás
  const generateSerialNumber = () => {
    return `S7/${nextSerialNumber}`;
  };

  // Validációs és osztályozási logika
  const calculateValidations = (data) => {
    const age = parseInt(data.age);
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height);
    const systolic = parseInt(data.systolic);
    const diastolic = parseInt(data.diastolic);
    const pulse = parseInt(data.pulse);
    const oxygen = parseInt(data.oxygen);

    // Korcsoport
    let ageGroup = '';
    if (age <= 30) ageGroup = '0-30';
    else if (age <= 40) ageGroup = '31-40';
    else if (age <= 50) ageGroup = '41-50';
    else if (age <= 60) ageGroup = '51-60';
    else if (age <= 70) ageGroup = '61-70';
    else if (age <= 80) ageGroup = '71-80';
    else ageGroup = '81+';

    // BMI számítás
    const bmi = weight / Math.pow(height / 100, 2);
    let bmiClass = '';
    if (bmi < 16) bmiClass = 'piros';
    else if (bmi < 18.5) bmiClass = 'fehér';
    else if (bmi <= 24.99) bmiClass = 'zöld';
    else if (bmi <= 29.99) bmiClass = 'fehér';
    else if (bmi <= 34.99) bmiClass = 'fehér';
    else if (bmi <= 39.99) bmiClass = 'piros';
    else bmiClass = 'piros';

    // Vérnyomás osztály
    let bpClass = '';
    if (systolic >= 110 && systolic <= 130 && diastolic >= 60 && diastolic <= 80) {
      bpClass = 'zöld';
    } else {
      bpClass = 'fehér';
    }

    // Oxigén osztály
    let oxygenClass = '';
    if (oxygen < 93) oxygenClass = 'piros';
    else if (oxygen <= 94) oxygenClass = 'fehér';
    else if (oxygen >= 94 && oxygen <= 100) oxygenClass = 'zöld';

    // Pulzus osztály
    let pulseClass = '';
    if (pulse >= 60 && pulse <= 90) {
      pulseClass = 'zöld';
    } else if (pulse >= 50 && pulse <= 59 && age < 55 && bmi < 30) {
      pulseClass = 'zöld';
    } else if (pulse < 50 || pulse > 100) {
      pulseClass = 'piros';
    } else {
      pulseClass = 'fehér';
    }

    // Betegség-gyógyszer validáció
    const diseaseValidations = {};
    const diseaseKeys = ['magas_vernyomas', 'magas_verzsir', 'cukorbetegseg', 'tudobetegseg', 'erszukuleт', 'szivritmus'];
    
    diseaseKeys.forEach(disease => {
      const hasDisease = data.diseases[disease];
      let hasMedication = false;
      
      // Gyógyszer kapcsolatok
      if (disease === 'magas_vernyomas') hasMedication = data.medications['magas_vernyomas_gyogyszer'];
      else if (disease === 'magas_verzsir') hasMedication = data.medications['magas_verzsir_gyogyszer'];
      else if (disease === 'cukorbetegseg') hasMedication = data.medications['cukorbetegseg_tabletta'] || data.medications['cukorbetegseg_injeksio'];
      else if (disease === 'tudobetegseg') hasMedication = data.medications['tudobetegseg_gyogyszer'];
      else if (disease === 'erszukuleт') hasMedication = data.medications['erszukuleт_gyogyszer'];
      else if (disease === 'szivritmus') hasMedication = data.medications['szivritmus_gyogyszer'];

      if (!hasDisease) {
        diseaseValidations[disease] = 'zöld';
      } else if (hasDisease && hasMedication) {
        diseaseValidations[disease] = 'sárga';
      } else if (hasDisease && !hasMedication) {
        diseaseValidations[disease] = 'piros';
      }
    });

    // Dohányzás
    const smokingClass = data.smoking === 'no_smoking' ? 'zöld' : 'sárga';

    return {
      ageGroup,
      bmi: bmi.toFixed(1),
      bmiClass,
      bpClass,
      oxygenClass,
      pulseClass,
      diseaseValidations,
      smokingClass
    };
  };

  // Ajánlott osztály számítása
  const calculateRecommendedClass = (validations) => {
    const redCount = Object.values(validations.diseaseValidations).filter(v => v === 'piros').length +
                   [validations.bmiClass, validations.oxygenClass, validations.pulseClass].filter(v => v === 'piros').length;
    
    const yellowCount = Object.values(validations.diseaseValidations).filter(v => v === 'sárga').length +
                       [validations.smokingClass].filter(v => v === 'sárga').length;

    if (redCount > 0) return 'piros';
    if (yellowCount > 0) return 'sárga';
    return 'zöld';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Név megadása kötelező';
    if (!formData.postalCode.match(/^\d{4}$/)) newErrors.postalCode = 'Irányítószám 4 számjegy kell legyen';
    if (!formData.age || formData.age < 1 || formData.age > 120) newErrors.age = 'Érvényes életkor megadása kötelező';
    if (!formData.gender) newErrors.gender = 'Nem kiválasztása kötelező';
    if (!formData.weight || formData.weight < 1) newErrors.weight = 'Testsúly megadása kötelező';
    if (!formData.height || formData.height < 50) newErrors.height = 'Testmagasság megadása kötelező';
    if (!formData.systolic || formData.systolic < 50) newErrors.systolic = 'Systolic vérnyomás megadása kötelező';
    if (!formData.diastolic || formData.diastolic < 30) newErrors.diastolic = 'Diastolic vérnyomás megadása kötelező';
    if (!formData.pulse || formData.pulse < 30) newErrors.pulse = 'Pulzus megadása kötelező';
    if (!formData.oxygen || formData.oxygen < 70) newErrors.oxygen = 'Oxigén szint megadása kötelező';
    if (!formData.smoking) newErrors.smoking = 'Dohányzási szokások megadása kötelező';
    
    // Betegségek validáció
    Object.keys(formData.diseases).forEach(disease => {
      if (formData.diseases[disease] === null) {
        newErrors[`disease_${disease}`] = 'Válasz megadása kötelező';
      }
    });

    // Gyógyszerek validáció
    Object.keys(formData.medications).forEach(medication => {
      if (formData.medications[medication] === null) {
        newErrors[`medication_${medication}`] = 'Válasz megadása kötelező';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDiseaseChange = (disease, value) => {
    setFormData(prev => ({
      ...prev,
      diseases: { ...prev.diseases, [disease]: value }
    }));
    if (errors[`disease_${disease}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`disease_${disease}`];
        return newErrors;
      });
    }
  };

  const handleMedicationChange = (medication, value) => {
    setFormData(prev => ({
      ...prev,
      medications: { ...prev.medications, [medication]: value }
    }));
    if (errors[`medication_${medication}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`medication_${medication}`];
        return newErrors;
      });
    }
  };

  // Firebase submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Kérjük javítsa ki a hibákat a folytatáshoz!');
      return;
    }
    
    setLoading(true);
    
    try {
      const serialNumber = generateSerialNumber();
      const validations = calculateValidations(formData);
      const recommendedClass = calculateRecommendedClass(validations);
      
      const submissionData = {
        serialNumber,
        ...formData,
        validations,
        recommendedClass,
        selectedClass: recommendedClass
      };
      
      // Save to Firebase
      await firebaseService.addScreening(submissionData);
      
      // Update next serial number
      setNextSerialNumber(prev => prev + 1);
      
      // Form reset
      setFormData({
        name: '', postalCode: '', age: '', gender: '', weight: '', height: '',
        systolic: '', diastolic: '', pulse: '', oxygen: '', notes: '',
        diseases: {
          'magas_vernyomas': null, 'magas_verzsir': null, 'cukorbetegseg': null,
          'tudobetegseg': null, 'erszukuleт': null, 'szivritmus': null
        },
        medications: {
          'magas_vernyomas_gyogyszer': null, 'magas_verzsir_gyogyszer': null,
          'cukorbetegseg_tabletta': null, 'cukorbetegseg_injeksio': null,
          'tudobetegseg_gyogyszer': null, 'erszukuleт_gyogyszer': null,
          'szivritmus_gyogyszer': null
        },
        smoking: ''
      });
      setErrors({});
      
      alert(`Sikeres beküldés!\nSorszám: ${serialNumber}`);
      
    } catch (error) {
      console.error('Hiba a beküldés során:', error);
      alert('Hiba történt a mentés során. Kérjük próbálja újra!');
    } finally {
      setLoading(false);
    }
  };

  const getClassLabel = (classType) => {
    switch(classType) {
      case 'piros': return 'Piros Osztály';
      case 'sárga': return 'Sárga Osztály';
      case 'zöld': return 'Zöld Osztály';
      default: return 'Ismeretlen';
    }
  };

  const getClassColor = (classType) => {
    switch(classType) {
      case 'piros': return 'bg-red-100 text-red-800 border-red-300';
      case 'sárga': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'zöld': return 'bg-green-100 text-green-800 border-green-300';
      case 'fehér': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const diseaseLabels = {
    'magas_vernyomas': 'Magas vérnyomás',
    'magas_verzsir': 'Magas vérzsír/koleszterin',
    'cukorbetegseg': 'Cukorbetegség',
    'tudobetegseg': 'Tüdőbetegség',
    'erszukuleт': 'Érszűkület',
    'szivritmus': 'Szívritmus zavar'
  };

  const medicationLabels = {
    'magas_vernyomas_gyogyszer': 'magas vérnyomásra',
    'magas_verzsir_gyogyszer': 'magas vérzsír/koleszterinre',
    'cukorbetegseg_tabletta': 'cukorbetegség tabletta',
    'cukorbetegseg_injeksio': 'cukorbetegség injekció',
    'tudobetegseg_gyogyszer': 'tüdőbetegségre',
    'erszukuleт_gyogyszer': 'érszűkületre',
    'szivritmus_gyogyszer': 'szívritmus zavarra'
  };

  const smokingOptions = [
    { value: 'no_smoking', label: 'sosem dohányoztam és nikotinos termékeket sem használok' },
    { value: 'light_smoker', label: 'igen, dohányzás, vagy pipázás vagy hevített dohánytermék vagy e-cigarettát használok' },
    { value: 'occasional_smoker', label: 'már nem dohányzom, és nikotin tartalmú termékeket sem használok' },
    { value: 'heavy_smoker', label: 'nem dohányzom, de egyéb nikotinos termékeket használok' }
  ];

  // CSV export funkciók
  const generateCSVExport = () => {
    const headers = [
      'Sorszám', 'Név', 'Irányítószám', 'Életkor', 'Nem', 'Testsúly', 'Testmagasság', 
      'BMI', 'BMI Osztály', 'Systolic', 'Diastolic', 'Vérnyomás Osztály', 'Pulzus', 
      'Pulzus Osztály', 'Oxigén', 'Oxigén Osztály', 'Dohányzás', 'Dohányzás Osztály',
      'Magas vérnyomás', 'Magas vérzsír', 'Cukorbetegség', 'Tüdőbetegség', 'Érszűkület', 
      'Szívritmus zavar', 'Ajánlott Osztály', 'Megjegyzés', 'Időpont'
    ];

    const rows = submissions.map(submission => [
      submission.serialNumber,
      submission.name,
      submission.postalCode,
      submission.age,
      submission.gender,
      submission.weight,
      submission.height,
      submission.validations.bmi,
      submission.validations.bmiClass,
      submission.systolic,
      submission.diastolic,
      submission.validations.bpClass,
      submission.pulse,
      submission.validations.pulseClass,
      submission.oxygen,
      submission.validations.oxygenClass,
      submission.smoking,
      submission.validations.smokingClass,
      submission.validations.diseaseValidations.magas_vernyomas,
      submission.validations.diseaseValidations.magas_verzsir,
      submission.validations.diseaseValidations.cukorbetegseg,
      submission.validations.diseaseValidations.tudobetegseg,
      submission.validations.diseaseValidations.erszukuleт,
      submission.validations.diseaseValidations.szivritmus,
      submission.recommendedClass,
      submission.notes || '',
      submission.timestamp ? new Date(submission.timestamp.seconds * 1000).toLocaleString('hu-HU') : ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Mentés folyamatban...</p>
        </div>
      </div>
    );
  }

  // Kérdőív nézet
  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('form')}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Szűrő Kérdőív
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Szűrő Elemzés ({submissions.length})
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Következő sorszám: S7/{nextSerialNumber}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Egészségügyi Szűrő Kérdőív</h1>
              <p className="text-gray-600">Kérjük töltse ki az alábbi kérdőívet a páciens kockázati besorolásához</p>
              <p className="text-sm text-blue-600 mt-2">Automatikus sorszám: S7/{nextSerialNumber}</p>
            </div>

            <div className="space-y-8">
              {/* Személyes adatok */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Személyes adatok
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keresztnév *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Irányítószám *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="1234"
                      maxLength="4"
                    />
                    {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Életkor *</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nem *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Válasszon</option>
                      <option value="Férfi">Férfi</option>
                      <option value="Nő">Nő</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Testsúly (kg) *</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Testmagasság (cm) *</label>
                    <input
                      type="number"
                      min="50"
                      max="250"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vérnyomás systole (Hgmm) *</label>
                    <input
                      type="number"
                      min="50"
                      max="300"
                      value={formData.systolic}
                      onChange={(e) => handleInputChange('systolic', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.systolic ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.systolic && <p className="text-red-500 text-sm mt-1">{errors.systolic}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vérnyomás diastole (Hgmm) *</label>
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={formData.diastolic}
                      onChange={(e) => handleInputChange('diastolic', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.diastolic ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.diastolic && <p className="text-red-500 text-sm mt-1">{errors.diastolic}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pulzus *</label>
                    <input
                      type="number"
                      min="30"
                      max="200"
                      value={formData.pulse}
                      onChange={(e) => handleInputChange('pulse', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.pulse ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.pulse && <p className="text-red-500 text-sm mt-1">{errors.pulse}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">O2 (%) *</label>
                    <input
                      type="number"
                      min="70"
                      max="100"
                      value={formData.oxygen}
                      onChange={(e) => handleInputChange('oxygen', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.oxygen ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.oxygen && <p className="text-red-500 text-sm mt-1">{errors.oxygen}</p>}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Megjegyzés</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Betegségek */}
              <div className="bg-red-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">
                  Tud-e Ön arról, hogy az alábbi betegségei vannak: *
                </h2>
                <div className="space-y-4">
                  {Object.entries(diseaseLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <div className="flex space-x-8">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`disease_${key}`}
                            checked={formData.diseases[key] === true}
                            onChange={() => handleDiseaseChange(key, true)}
                            className="mr-2"
                          />
                          IGEN
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`disease_${key}`}
                            checked={formData.diseases[key] === false}
                            onChange={() => handleDiseaseChange(key, false)}
                            className="mr-2"
                          />
                          NEM
                        </label>
                      </div>
                      {errors[`disease_${key}`] && <p className="text-red-500 text-sm">{errors[`disease_${key}`]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gyógyszerek */}
              <div className="bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                  <Pill className="w-5 h-5 mr-2" />
                  Szed-e rendszeresen gyógyszert az alábbi krónikus betegségekre: *
                </h2>
                <div className="space-y-4">
                  {Object.entries(medicationLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700">{label}</span>
                      <div className="flex space-x-8">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`medication_${key}`}
                            checked={formData.medications[key] === true}
                            onChange={() => handleMedicationChange(key, true)}
                            className="mr-2"
                          />
                          IGEN
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`medication_${key}`}
                            checked={formData.medications[key] === false}
                            onChange={() => handleMedicationChange(key, false)}
                            className="mr-2"
                          />
                          NEM
                        </label>
                      </div>
                      {errors[`medication_${key}`] && <p className="text-red-500 text-sm">{errors[`medication_${key}`]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dohányzás */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-yellow-800 mb-4">
                  Dohányzási szokások *
                </h2>
                <div className="space-y-3">
                  {smokingOptions.map((option) => (
                    <label key={option.value} className="flex items-start">
                      <input
                        type="radio"
                        name="smoking"
                        value={option.value}
                        checked={formData.smoking === option.value}
                        onChange={(e) => handleInputChange('smoking', e.target.value)}
                        className="mr-3 mt-1"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.smoking && <p className="text-red-500 text-sm mt-2">{errors.smoking}</p>}
              </div>

              {/* Submit button */}
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200"
                >
                  {loading ? 'Mentés...' : 'Kérdőív Beküldése'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard nézet
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('form')}
                  className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Szűrő Kérdőív
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Szűrő Elemzés ({submissions.length})
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const csvContent = generateCSVExport();
                    downloadCSV(csvContent, 'szuro_eredmenyek.csv');
                  }}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV Export
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Szűrési Eredmények Elemzése</h1>
            
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Még nincsenek beküldött kérdőívek</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Összesítő statisztikák */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-red-800 font-semibold">Piros Osztály</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {submissions.filter(s => s.recommendedClass === 'piros').length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-yellow-800 font-semibold">Sárga Osztály</h3>
                    <p className="text-2xl font-bold text-yellow-600">
                      {submissions.filter(s => s.recommendedClass === 'sárga').length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-green-800 font-semibold">Zöld Osztály</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {submissions.filter(s => s.recommendedClass === 'zöld').length}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-blue-800 font-semibold">Összes</h3>
                    <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                  </div>
                </div>

                {/* Részletes lista */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Sorszám</th>
                        <th className="border border-gray-300 p-2 text-left">Név</th>
                        <th className="border border-gray-300 p-2 text-left">Kor</th>
                        <th className="border border-gray-300 p-2 text-left">Nem</th>
                        <th className="border border-gray-300 p-2 text-left">BMI</th>
                        <th className="border border-gray-300 p-2 text-left">Vérnyomás</th>
                        <th className="border border-gray-300 p-2 text-left">Ajánlott Osztály</th>
                        <th className="border border-gray-300 p-2 text-left">Időpont</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{submission.serialNumber}</td>
                          <td className="border border-gray-300 p-2">{submission.name}</td>
                          <td className="border border-gray-300 p-2">{submission.age}</td>
                          <td className="border border-gray-300 p-2">{submission.gender}</td>
                          <td className="border border-gray-300 p-2">
                            <span className={`px-2 py-1 rounded text-sm ${getClassColor(submission.validations.bmiClass)}`}>
                              {submission.validations.bmi}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <span className={`px-2 py-1 rounded text-sm ${getClassColor(submission.validations.bpClass)}`}>
                              {submission.systolic}/{submission.diastolic}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <span className={`px-2 py-1 rounded font-semibold ${getClassColor(submission.recommendedClass)}`}>
                              {getClassLabel(submission.recommendedClass)}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-2">
                            {submission.timestamp ? new Date(submission.timestamp.seconds * 1000).toLocaleString('hu-HU') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HealthScreeningSystem;