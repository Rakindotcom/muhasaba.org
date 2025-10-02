import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set user first, then try Firestore operations
        setUser(user);

        // Register device session with validation
        try {
          const registrationResult = await registerDeviceSession(user.uid);
          if (!registrationResult.success) {
            console.warn('Device session registration failed:', registrationResult.error);
            // If device limit exceeded, show warning but don't log out
            if (registrationResult.error?.includes('device limit')) {
              console.warn('Device limit reached - oldest sessions removed');
            }
          }
        } catch (error) {
          console.warn('Device session registration failed:', error);
          // Don't prevent authentication if device registration fails
        }

        // Try to create or update user document in Firestore (optional)
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || '',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
          } else {
            // Update last login
            await setDoc(userRef, {
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
        } catch (error) {
          console.warn('Firestore operation failed (user still authenticated):', error);
          // Don't prevent authentication if Firestore fails
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
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

  // Track user activity (gracefully handle Firestore permission errors)
  const trackActivity = async (activity, data = {}) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'userActivities'), {
        userId: user.uid,
        activity,
        data,
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
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