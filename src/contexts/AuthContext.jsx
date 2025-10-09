import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { handleFirebaseError } from '../utils/firebaseErrorHandler';
import { registerDeviceSession, removeDeviceSession } from '../utils/deviceManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if auth is properly initialized
    if (!auth) {
      console.warn('Firebase Auth not initialized, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Set user first, then try Firestore operations
          setUser(user);

          // Register device session with validation (non-blocking)
          registerDeviceSession(user.uid).catch(error => {
            console.warn('Device session registration failed:', error);
          });

          // Try to create or update user document in Firestore (non-blocking)
          const userRef = doc(db, 'users', user.uid);
          getDoc(userRef).then(userSnap => {
            if (!userSnap.exists()) {
              setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || '',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              }).catch(error => {
                console.warn('Failed to create user document:', error);
              });
            } else {
              // Update last login
              setDoc(userRef, {
                lastLogin: serverTimestamp()
              }, { merge: true }).catch(error => {
                console.warn('Failed to update last login:', error);
              });
            }
          }).catch(error => {
            console.warn('Failed to check user document:', error);
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Still set user state even if other operations fail
        setUser(user);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      // Handle auth state change errors
      console.error('Firebase Auth state change error:', error);
      setLoading(false);
      // Don't throw error, just log it
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const signup = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      return userCredential;
    } catch (error) {
      const errorInfo = handleFirebaseError(error);
      throw new Error(errorInfo.message);
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const errorInfo = handleFirebaseError(error);
      throw new Error(errorInfo.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      // Handle account exists with different credential
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। দয়া করে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।');
      }
      const errorInfo = handleFirebaseError(error);
      throw new Error(errorInfo.message);
    }
  };

  const resetPassword = async (email) => {
    try {
      // Configure action code settings for better email deliverability
      const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: window.location.origin + '/login',
        // This must be true
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { success: true };
    } catch (error) {
      const errorInfo = handleFirebaseError(error);
      throw new Error(errorInfo.message);
    }
  };

  const logout = async () => {
    // Remove device session before signing out
    if (user?.uid) {
      try {
        await removeDeviceSession(user.uid);
      } catch (error) {
        console.warn('Device session cleanup failed:', error);
        // Don't prevent logout if device cleanup fails
      }
    }

    return await signOut(auth);
  };

  // Link Google account to existing email/password account
  const linkGoogleAccount = async () => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const credential = GoogleAuthProvider.credential();
      await linkWithCredential(user, credential);
      return { success: true };
    } catch (error) {
      const errorInfo = handleFirebaseError(error);
      throw new Error(errorInfo.message);
    }
  };

  // Track user activity (gracefully handle Firestore permission errors)
  const trackActivity = async (activity, data = {}) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'userActivities'), {
        userId: user.uid,
        activity,
        data,
        timestamp: serverTimestamp(),
        date: (() => {
          const today = new Date()
          const year = today.getFullYear()
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const day = String(today.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })()
      });
    } catch (error) {
      console.warn('Activity tracking failed (continuing without tracking):', error);
      // Don't throw error - app should continue working even if tracking fails
    }
  };

  const value = {
    user,
    signup,
    login,
    loginWithGoogle,
    linkGoogleAccount,
    resetPassword,
    logout,
    trackActivity,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};