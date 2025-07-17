Healthcare Queue Management System
A React-based healthcare queue management system with Firebase backend, designed for managing patient queues in medical facilities.

Features
Patient Registration: Patients can register with their serial number and select a screening station
Admin Dashboard: Healthcare staff can manage patient queues, call patients, and mark treatments as complete
Waiting Room Display: Large screen display showing currently called patients for each station
Real-time Updates: All changes are synchronized in real-time across all views using Firebase Realtime Database
Technology Stack
Frontend: React 18 with Tailwind CSS
Icons: Lucide React
Database: Firebase Realtime Database
Hosting: Netlify
Project Structure
healthcare-queue-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AdminDashboard.js
│   │   ├── Navigation.js
│   │   ├── PatientRegistration.js
│   │   └── WaitingRoomDisplay.js
│   ├── config/
│   │   └── firebase.js
│   ├── constants/
│   │   └── index.js
│   ├── hooks/
│   │   └── usePatients.js
│   ├── services/
│   │   └── firebase.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
├── tailwind.config.js
└── README.md
Setup Instructions
1. Clone the Repository
bash
git clone <your-repo-url>
cd healthcare-queue-app
2. Install Dependencies
bash
npm install
3. Firebase Setup
Go to Firebase Console
Create a new project or select an existing one
Enable Realtime Database:
Go to "Realtime Database" in the left sidebar
Click "Create Database"
Choose "Start in test mode" (you can modify rules later)
Select your preferred location
Get your Firebase configuration:
Go to Project Settings (gear icon)
Scroll down to "Your apps" section
Click "Add app" and select "Web"
Register your app and copy the configuration object
4. Environment Variables
Copy the example environment file:
bash
cp .env.example .env
Fill in your Firebase configuration in the .env file:
bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
5. Run the Application
bash
npm start
The application will open in your browser at http://localhost:3000.

Deployment on Netlify
Option 1: Deploy from GitHub (Recommended)
Push your code to GitHub
Go to Netlify and sign in
Click "New site from Git"
Connect your GitHub repository
Configure build settings:
Build command: npm run build
Publish directory: build
Add environment variables in Netlify:
Go to Site settings > Environment variables
Add all your REACT_APP_ variables from your .env file
Deploy the site
Option 2: Manual Deploy
Build the project:
bash
npm run build
Go to Netlify and sign in
Drag and drop the build folder to deploy
Firebase Database Structure
The application uses the following database structure:

json
{
  "patients": {
    "patientId": {
      "serialNumber": "string",
      "station": "string",
      "timestamp": "ISO string",
      "status": "waiting|called|completed"
    }
  },
  "calledPatients": {
    "calledId": {
      "serialNumber": "string",
      "station": "string",
      "timestamp": "ISO string",
      "calledAt": "ISO string"
    }
  }
}
Usage
Patient Registration
Patients enter their serial number and select a screening station
They are added to the waiting queue for that station
Admin Dashboard
Healthcare staff can view waiting patients for each station
Call patients to move them from waiting to called status
Mark treatments as complete to remove patients from the system
Waiting Room Display
Large screen showing currently called patients
Patients can see when their number is called for their station
Real-time updates when new patients are called
Customization
Adding New Stations
To add new medical stations, modify the STATIONS array in src/constants/index.js:

javascript
export const STATIONS = [
  { 
    id: 'newstation', 
    name: 'New Station Name', 
    icon: YourIcon, 
    color: 'bg-color-500' 
  },
  // ... existing stations
];
Styling
The application uses Tailwind CSS for styling. You can customize the appearance by modifying the Tailwind classes in the component files.

Support
For issues and questions, please create an issue in the GitHub repository.

License
This project is licensed under the MIT License.

