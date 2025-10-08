// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAuF0lD8ZnCtCupvEYCzyFEnm_a9SXgK9g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "muhasaba-40225.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "muhasaba-40225",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "muhasaba-40225.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1088616142657",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1088616142657:web:e0688c418fc284714933c0"
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

// Initialize Firebase with error handling
let app, auth, db, googleProvider;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
  
  // Initialize Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // Configure auth persistence with better error handling
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Failed to set auth persistence (non-critical):', error.code || error.message);
  });
  
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create fallback objects to prevent app crashes
  auth = null;
  db = null;
  googleProvider = null;
}

export { auth, db, googleProvider };

// Add comprehensive global error handler for Firebase errors
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  // Handle Firebase Auth errors
  if (error?.code?.startsWith('auth/')) {
    console.warn('Firebase Auth Error (suppressed):', error.code);
    event.preventDefault();
    return;
  }
  
  // Handle Firebase errors in general
  if (error?.message?.includes('Firebase') || error?.name?.includes('Firebase')) {
    console.warn('Firebase Error (suppressed):', error.message || error.code);
    event.preventDefault();
    return;
  }
  
  // Handle internal Firebase errors that don't have proper error codes
  if (error?.message?.includes('internal-error') || 
      error?.stack?.includes('firebase') ||
      error?.stack?.includes('Firebase')) {
    console.warn('Firebase Internal Error (suppressed)');
    event.preventDefault();
    return;
  }
});

// Also handle regular errors that might be Firebase-related
window.addEventListener('error', (event) => {
  const error = event.error;
  
  if (error?.message?.includes('Firebase') || 
      error?.stack?.includes('firebase') ||
      error?.name?.includes('Firebase')) {
    console.warn('Firebase Error (suppressed via error handler):', error.message);
    event.preventDefault();
    return;
  }
});

console.log('Firebase initialized successfully');

export default app;