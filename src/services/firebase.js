// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  orderByChild,
  query,
  serverTimestamp,
  update,
  remove,
  set
} from 'firebase/database';

// Firebase konfiguráció a .env fájlból
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Ellenőrizzük, hogy minden környezeti változó be van állítva
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN', 
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Hiányzó Firebase környezeti változók:', missingVars);
  console.error('Kérjük ellenőrizd a .env fájlt!');
}

// Firebase inicializálás
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Egészségügyi szűrések és váróterem kezelése
export const firebaseService = {
  // === PATIENT MANAGEMENT METHODS === //
  
  // Új beteg hozzáadása
  addPatient: async (patientData) => {
    try {
      const patientsRef = ref(database, 'patients');
      const newPatientRef = await push(patientsRef, {
        ...patientData,
        timestamp: serverTimestamp(),
        status: 'waiting'
      });
      console.log('Beteg hozzáadva:', newPatientRef.key);
      return newPatientRef.key;
    } catch (error) {
      console.error('Hiba a beteg hozzáadásakor:', error);
      throw error;
    }
  },

  // Betegek valós idejű lekérdezése
  subscribeToPatients: (callback) => {
    const patientsRef = ref(database, 'patients');
    const patientsQuery = query(patientsRef, orderByChild('timestamp'));
    
    return onValue(patientsQuery, (snapshot) => {
      const patients = {};
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          patients[key] = {
            id: key,
            ...data[key]
          };
        });
      }
      callback(patients);
    }, (error) => {
      console.error('Hiba a betegek lekérdezésekor:', error);
      throw error;
    });
  },

  // Behívott betegek valós idejű lekérdezése
  subscribeToCalledPatients: (callback) => {
    const calledPatientsRef = ref(database, 'calledPatients');
    const calledQuery = query(calledPatientsRef, orderByChild('timestamp'));
    
    return onValue(calledQuery, (snapshot) => {
      const calledPatients = {};
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          calledPatients[key] = {
            id: key,
            ...data[key]
          };
        });
      }
      callback(calledPatients);
    }, (error) => {
      console.error('Hiba a behívott betegek lekérdezésekor:', error);
      throw error;
    });
  },

  // Beteg státusz frissítése
  updatePatientStatus: async (patientId, status) => {
    try {
      const patientRef = ref(database, `patients/${patientId}`);
      await update(patientRef, { status });
      console.log('Beteg státusz frissítve:', patientId, status);
    } catch (error) {
      console.error('Hiba a státusz frissítésekor:', error);
      throw error;
    }
  },

  // Behívott beteg hozzáadása
  addCalledPatient: async (calledPatientData) => {
    try {
      const calledPatientsRef = ref(database, 'calledPatients');
      const newCalledRef = await push(calledPatientsRef, {
        ...calledPatientData,
        calledAt: serverTimestamp()
      });
      console.log('Behívott beteg hozzáadva:', newCalledRef.key);
      return newCalledRef.key;
    } catch (error) {
      console.error('Hiba a behívott beteg hozzáadásakor:', error);
      throw error;
    }
  },

  // Behívott beteg eltávolítása
  removeCalledPatient: async (calledPatientId) => {
    try {
      const calledPatientRef = ref(database, `calledPatients/${calledPatientId}`);
      await remove(calledPatientRef);
      console.log('Behívott beteg eltávolítva:', calledPatientId);
    } catch (error) {
      console.error('Hiba a behívott beteg eltávolításakor:', error);
      throw error;
    }
  },

  // Beteg eltávolítása
  removePatient: async (patientId) => {
    try {
      const patientRef = ref(database, `patients/${patientId}`);
      await remove(patientRef);
      console.log('Beteg eltávolítva:', patientId);
    } catch (error) {
      console.error('Hiba a beteg eltávolításakor:', error);
      throw error;
    }
  },

  // === HEALTH SCREENING METHODS === //
  
  // Új szűrés hozzáadása
  addScreening: async (screeningData) => {
    try {
      const healthScreeningsRef = ref(database, 'health_screenings');
      const newScreeningRef = await push(healthScreeningsRef, {
        ...screeningData,
        timestamp: serverTimestamp()
      });
      console.log('Szűrés mentve:', newScreeningRef.key);
      return newScreeningRef.key;
    } catch (error) {
      console.error('Hiba a szűrés mentésekor:', error);
      throw error;
    }
  },

  // Szűrés választott osztályának frissítése
  updateScreeningSelectedClass: async (screeningId, selectedClass) => {
    try {
      const screeningRef = ref(database, `health_screenings/${screeningId}`);
      await update(screeningRef, { selectedClass });
      console.log('Választott osztály frissítve:', screeningId, selectedClass);
    } catch (error) {
      console.error('Hiba a választott osztály frissítésekor:', error);
      throw error;
    }
  },

  // Szűrések valós idejű lekérdezése
  subscribeToScreenings: (callback) => {
    const healthScreeningsRef = ref(database, 'health_screenings');
    const screeningsQuery = query(healthScreeningsRef, orderByChild('timestamp'));
    
    return onValue(screeningsQuery, (snapshot) => {
      const screenings = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          screenings.push({
            id: key,
            ...data[key]
          });
        });
        // Fordított sorrend (legújabb elől)
        screenings.reverse();
      }
      callback(screenings);
    }, (error) => {
      console.error('Hiba a szűrések lekérdezésekor:', error);
      throw error;
    });
  }
};

export default app;