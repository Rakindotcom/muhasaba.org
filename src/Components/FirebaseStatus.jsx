import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const FirebaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkFirebaseStatus = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase Auth not initialized');
        }
        
        setStatus('ready');
        console.log('Firebase Status: Ready');
      } catch (error) {
        console.error('Firebase Status Error:', error);
        setStatus('error');
      }
    };

    checkFirebaseStatus();
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg text-lg z-40">
        🔄 Checking Firebase...
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="fixed top-4 right-4 z-40">
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Firebase Ready</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div 
        className="bg-orange-100 border border-orange-400 text-orange-700 px-3 py-2 rounded-lg text-lg cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Setup Required</span>
        </div>
        
        {showDetails && (
          <div className="mt-2 p-2 bg-white rounded border text-base">
            <p className="mb-2">Enable Email/Password auth in Firebase Console</p>
            <a
              href="https://console.firebase.google.com/project/muhasaba-40225/authentication/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Console</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseStatus;