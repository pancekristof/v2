import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase';

export const usePatients = () => {
  const [patients, setPatients] = useState({});
  const [calledPatients, setCalledPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribePatients;
    let unsubscribeCalled;

    try {
      // Subscribe to patients
      unsubscribePatients = firebaseService.subscribeToPatients((data) => {
        setPatients(data);
        setLoading(false);
      });

      // Subscribe to called patients
      unsubscribeCalled = firebaseService.subscribeToCalledPatients((data) => {
        setCalledPatients(data);
        setLoading(false);
      });

    } catch (err) {
      setError(err);
      setLoading(false);
    }

    return () => {
      if (unsubscribePatients) unsubscribePatients();
      if (unsubscribeCalled) unsubscribeCalled();
    };
  }, []);

  return { 
    patients, 
    calledPatients, 
    loading, 
    error,
    firebaseService 
  };
};