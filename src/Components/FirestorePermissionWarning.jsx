import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

const FirestorePermissionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkFirestorePermissions = async () => {
      if (!user || dismissed) return;

      try {
        // Try to read user document to test permissions
        const userRef = doc(db, 'users', user.uid);
        await getDoc(userRef);
        setShowWarning(false);
      } catch (error) {
        if (error.code === 'permission-denied' || error.message.includes('insufficient permissions')) {
          setShowWarning(true);
        }
      }
    };

    if (user) {
      checkFirestorePermissions();
    }
  }, [user, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-orange-800 mb-1">
            Database Permissions Needed
          </h4>
          <p className="text-base text-orange-700 mb-3">
            Some features may not work properly. Update Firestore security rules to enable full functionality.
          </p>
          <div className="flex items-center space-x-2">
            <a
              href="https://console.firebase.google.com/project/muhasaba-40225/firestore/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-base bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Fix Rules</span>
            </a>
            <button
              onClick={handleDismiss}
              className="text-base text-orange-600 hover:text-orange-800"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-orange-400 hover:text-orange-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FirestorePermissionWarning;