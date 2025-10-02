// Firebase Status Checker
import { auth, db } from '../firebase';

export const checkFirebaseStatus = () => {
  console.log('=== Firebase Status Check ===');
  
  // Check if Firebase is initialized
  console.log('Auth instance:', auth ? '✅ Initialized' : '❌ Not initialized');
  console.log('Firestore instance:', db ? '✅ Initialized' : '❌ Not initialized');
  
  // Check auth configuration
  if (auth) {
    console.log('Auth config:', {
      apiKey: auth.config?.apiKey ? '✅ Present' : '❌ Missing',
      authDomain: auth.config?.authDomain ? '✅ Present' : '❌ Missing',
      projectId: auth.config?.projectId ? '✅ Present' : '❌ Missing'
    });
  }
  
  // Check current auth state
  console.log('Current user:', auth?.currentUser ? '✅ Logged in' : '❌ Not logged in');
  
  console.log('=== End Firebase Status ===');
};

// Call this function to debug Firebase issues
// checkFirebaseStatus();