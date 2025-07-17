// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  orderByChild,
  query,
  serverTimestamp 
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

// Egészségügyi szűrések kezelése
export const firebaseService = {
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
    });
  }
};

export default app;