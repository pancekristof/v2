import { 
  Heart, 
  Scale, 
  Leaf, 
  Square, 
  Apple, 
  Dumbbell, 
  Smile, 
  Palette, 
  Activity,
  Stethoscope,
  FileText 
} from 'lucide-react';

export const VIEW_TYPES = {
  PATIENT: 'patient',
  ADMIN: 'admin',
  DISPLAY: 'display',
  SCREENING: 'screening'
};

export const PATIENT_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  COMPLETED: 'completed'
};

// EREDETI 10 ÁLLOMÁS + SZŰRŐ RENDSZER
export const STATIONS = [
  { 
    id: 'piros', 
    name: 'Piros', 
    icon: Heart, 
    color: 'bg-red-500' 
  },
  { 
    id: 'feher', 
    name: 'Fehér', 
    icon: Square, 
    color: 'bg-gray-500' 
  },
  { 
    id: 'zold', 
    name: 'Zöld', 
    icon: Leaf, 
    color: 'bg-green-500' 
  },
  { 
    id: 'inbody', 
    name: 'InBody', 
    icon: Scale, 
    color: 'bg-purple-500' 
  },
  { 
    id: 'dietetika', 
    name: 'Dietetika', 
    icon: Apple, 
    color: 'bg-orange-500' 
  },
  { 
    id: 'gyogytorna', 
    name: 'Gyógytorna', 
    icon: Dumbbell, 
    color: 'bg-blue-500' 
  },
  { 
    id: 'fogaszat', 
    name: 'Fogászat', 
    icon: Smile, 
    color: 'bg-cyan-500' 
  },
  { 
    id: 'borgyogyaszat', 
    name: 'Bőrgyógyászat', 
    icon: Palette, 
    color: 'bg-pink-500' 
  },
  { 
    id: 'mozgastanacsadas', 
    name: 'Mozgástanácsadás', 
    icon: Activity, 
    color: 'bg-indigo-500' 
  },
  { 
    id: 'allapotfelmeres', 
    name: 'Állapotfelmérés', 
    icon: Stethoscope, 
    color: 'bg-rose-500' 
  },
  { 
    id: 'health_screening', 
    name: 'Egészségügyi Szűrés', 
    icon: FileText, 
    color: 'bg-teal-500' 
  }
];