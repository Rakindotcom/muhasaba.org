// React Hook for Device Session Management
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  registerDeviceSession, 
  validateDeviceSession, 
  removeDeviceSession 
} from '../utils/deviceManager';
import { toast } from 'react-toastify';

export const useDeviceSession = () => {
  const { user, logout } = useAuth();
  const lastValidationRef = useRef(0);

  // Register device session on login
  const handleDeviceRegistration = useCallback(async (userId) => {
    try {
      const result = await registerDeviceSession(userId);
      if (!result.success) {
        console.error('Failed to register device session:', result.error);
        // Don't block login for device registration failures
      }
      return result;
    } catch (error) {
      console.error('Device registration error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Validate device session
  const validateCurrentSession = useCallback(async (userId, showNotification = false) => {
    try {
      // Throttle validation calls (max once per 5 minutes for better UX)
      const now = Date.now();
      if (now - lastValidationRef.current < 5 * 60 * 1000) {
        return { valid: true }; // Skip validation if called recently
      }
      lastValidationRef.current = now;

      const result = await validateDeviceSession(userId);
      
      if (!result.valid) {
        // Only force logout if it's a critical session issue
        if (result.reason?.includes('Device session not found') || 
            result.reason?.includes('exceeded device limit')) {
          
          if (showNotification) {
            toast.error('Your session has been terminated due to device limit. Please log in again.');
          }
          
          // Force logout only for critical issues
          await logout();
          return result;
        } else {
          // For other validation errors, just log but don't force logout
          console.warn('Session validation warning:', result.reason);
          return { valid: true }; // Allow user to continue
        }
      }
      
      return result;
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't force logout on network errors or temporary issues
      return { valid: true, reason: error.message };
    }
  }, [logout]);

  // Remove device session on logout
  const handleDeviceLogout = useCallback(async (userId) => {
    try {
      const result = await removeDeviceSession(userId);
      if (!result.success) {
        console.error('Failed to remove device session:', result.error);
        // Don't block logout for device cleanup failures
      }
      return result;
    } catch (error) {
      console.error('Device logout error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Set up device registration only (no automatic validation)
  useEffect(() => {
    if (user?.uid) {
      // Register device on login
      handleDeviceRegistration(user.uid);
      
      // No automatic validation - only manual validation when needed
      // This prevents unwanted logouts due to network issues or validation errors
    }
  }, [user?.uid, handleDeviceRegistration]);

  // Validate session on sensitive actions
  const validateForSensitiveAction = useCallback(async () => {
    if (!user?.uid) return { valid: false, reason: 'No user logged in' };
    return await validateCurrentSession(user.uid, true);
  }, [user?.uid, validateCurrentSession]);

  return {
    handleDeviceRegistration,
    validateCurrentSession,
    handleDeviceLogout,
    validateForSensitiveAction
  };
};

export default useDeviceSession;