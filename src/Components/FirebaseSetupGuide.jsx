import React from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

const FirebaseSetupGuide = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-orange-500 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">Firebase Setup Required</h2>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center text-green-800 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Firebase is connected successfully!
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-3">To enable user registration, you need to:</p>
            
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to Firebase Console</li>
              <li>Select your project: <span className="font-mono bg-gray-100 px-1 rounded">muhasaba-40225</span></li>
              <li>Click <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
              <li>Enable <strong>Email/Password</strong></li>
              <li>Save and refresh this page</li>
            </ol>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <a
            href="https://console.firebase.google.com/project/muhasaba-40225/authentication/providers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Firebase Console</span>
          </a>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetupGuide;