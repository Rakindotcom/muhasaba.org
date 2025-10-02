import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useTimeTracking = (pageName) => {
  const { trackActivity } = useAuth();
  const startTimeRef = useRef(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Track page visit
    trackActivity('page_visit', { 
      page: pageName,
      timestamp: new Date().toISOString()
    });

    // Track when user becomes inactive/active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        trackActivity('page_inactive', { 
          page: pageName,
          timeSpent: Date.now() - startTimeRef.current
        });
      } else {
        isActiveRef.current = true;
        startTimeRef.current = Date.now();
        trackActivity('page_active', { 
          page: pageName,
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function to track time spent when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (startTimeRef.current && isActiveRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        trackActivity('page_leave', { 
          page: pageName,
          timeSpent,
          duration: Math.round(timeSpent / 1000) // in seconds
        });
      }
    };
  }, [pageName, trackActivity]);

  // Function to track specific actions
  const trackAction = (action, data = {}) => {
    trackActivity('user_action', {
      page: pageName,
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  return { trackAction };
};