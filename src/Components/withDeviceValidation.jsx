// Higher-Order Component for Device Session Validation
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validateDeviceSession } from '../utils/deviceManager';
import { toast } from 'react-toastify';

const withDeviceValidation = (WrappedComponent, options = {}) => {
  const { 
    validateOnMount = false, 
    validateOnAction = true,
    showNotification = true 
  } = options;

  return function DeviceValidatedComponent(props) {
    const { user, logout } = useAuth();

    const validateSession = async (showToast = showNotification) => {
      if (!user?.uid) return { valid: false, reason: 'No user logged in' };

      try {
        const result = await validateDeviceSession(user.uid);
        
        if (!result.valid) {
          if (showToast) {
            toast.error('Your session has been terminated. Please log in again.');
          }
          
          // Force logout
          await logout();
          return result;
        }
        
        return result;
      } catch (error) {
        console.error('Session validation error:', error);
        return { valid: false, reason: error.message };
      }
    };

    // Validate on mount if required
    React.useEffect(() => {
      if (validateOnMount && user?.uid) {
        validateSession(false); // Don't show notification on mount
      }
    }, [user?.uid]);

    // Enhanced props with validation function
    const enhancedProps = {
      ...props,
      validateDeviceSession: validateSession,
      isSessionValid: true // You can enhance this with actual state if needed
    };

    return <WrappedComponent {...enhancedProps} />;
  };
};

export default withDeviceValidation;