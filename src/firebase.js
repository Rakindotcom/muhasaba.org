// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuF0lD8ZnCtCupvEYCzyFEnm_a9SXgK9g",
  authDomain: "muhasaba-40225.firebaseapp.com",
  projectId: "muhasaba-40225",
  storageBucket: "muhasaba-40225.firebasestorage.app",
  messagingSenderId: "1088616142657",
  appId: "1:1088616142657:web:e0688c418fc284714933c0"
};

// Validate Firebase configuration
const validateConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Firebase configuration missing required field: ${field}`);
    }
  }
};

// Validate configuration
validateConfig(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set auth persistence to LOCAL (keeps user logged in across browser sessions)
import { setPersistence, browserLocalPersistence } from "firebase/auth";

// Configure auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Failed to set auth persistence:', error);
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

console.log('Firebase initialized successfully');

export default app;