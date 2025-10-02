// Device Session Management Utility
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Generate a unique device ID
export const generateDeviceId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomStr}`;
};

// Get or create device ID for current device
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Get user agent string for device identification
export const getUserAgent = () => {
  return navigator.userAgent || 'Unknown Device';
};

// Get device info for display
export const getDeviceInfo = () => {
  const userAgent = getUserAgent();
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  
  // Detect device type
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    deviceType = 'Tablet';
  }
  
  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return { deviceType, browser, userAgent };
};

// Register device session in Firestore
export const registerDeviceSession = async (userId) => {
  try {
    const deviceId = getDeviceId();
    const deviceInfo = getDeviceInfo();
    
    // Check existing sessions for this user
    const userDevicesRef = collection(db, 'userDevices');
    const userSessionsQuery = query(
      userDevicesRef,
      where('userId', '==', userId),
      orderBy('lastActive', 'desc')
    );
    
    const existingSessions = await getDocs(userSessionsQuery);
    const sessions = existingSessions.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Check if current device is already registered
    const currentDeviceSession = sessions.find(session => session.deviceId === deviceId);
    
    if (currentDeviceSession) {
      // Update existing session
      await setDoc(doc(db, 'userDevices', currentDeviceSession.id), {
        userId,
        deviceId,
        ...deviceInfo,
        lastActive: serverTimestamp(),
        loginTime: currentDeviceSession.loginTime || serverTimestamp()
      });
    } else {
      // New device - check if we need to remove old sessions
      if (sessions.length >= 2) {
        // Remove oldest sessions to keep only 1 (so new one makes 2 total)
        const sessionsToRemove = sessions.slice(1); // Keep the most recent, remove others
        
        for (const session of sessionsToRemove) {
          await deleteDoc(doc(db, 'userDevices', session.id));
        }
      }
      
      // Add new device session
      const newSessionRef = doc(userDevicesRef);
      await setDoc(newSessionRef, {
        userId,
        deviceId,
        ...deviceInfo,
        lastActive: serverTimestamp(),
        loginTime: serverTimestamp()
      });
    }
    
    return { success: true, deviceId };
  } catch (error) {
    console.error('Error registering device session:', error);
    return { success: false, error: error.message };
  }
};

// Check if current device session is valid
export const validateDeviceSession = async (userId) => {
  try {
    const deviceId = getDeviceId();
    
    const userDevicesRef = collection(db, 'userDevices');
    const deviceQuery = query(
      userDevicesRef,
      where('userId', '==', userId),
      where('deviceId', '==', deviceId)
    );
    
    const deviceSessions = await getDocs(deviceQuery);
    
    if (deviceSessions.empty) {
      return { valid: false, reason: 'Device session not found' };
    }
    
    // Update last active time
    const sessionDoc = deviceSessions.docs[0];
    await setDoc(doc(db, 'userDevices', sessionDoc.id), {
      ...sessionDoc.data(),
      lastActive: serverTimestamp()
    });
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating device session:', error);
    return { valid: false, reason: error.message };
  }
};

// Remove device session on logout
export const removeDeviceSession = async (userId) => {
  try {
    const deviceId = getDeviceId();
    
    const userDevicesRef = collection(db, 'userDevices');
    const deviceQuery = query(
      userDevicesRef,
      where('userId', '==', userId),
      where('deviceId', '==', deviceId)
    );
    
    const deviceSessions = await getDocs(deviceQuery);
    
    for (const sessionDoc of deviceSessions.docs) {
      await deleteDoc(doc(db, 'userDevices', sessionDoc.id));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing device session:', error);
    return { success: false, error: error.message };
  }
};

// Get all active sessions for a user (for display purposes)
export const getUserActiveSessions = async (userId) => {
  try {
    const userDevicesRef = collection(db, 'userDevices');
    const userSessionsQuery = query(
      userDevicesRef,
      where('userId', '==', userId),
      orderBy('lastActive', 'desc')
    );
    
    const sessions = await getDocs(userSessionsQuery);
    return sessions.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isCurrentDevice: doc.data().deviceId === getDeviceId()
    }));
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

// Remove a specific session (for manual logout from settings)
export const removeSpecificSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, 'userDevices', sessionId));
    return { success: true };
  } catch (error) {
    console.error('Error removing specific session:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateDeviceId,
  getDeviceId,
  getUserAgent,
  getDeviceInfo,
  registerDeviceSession,
  validateDeviceSession,
  removeDeviceSession,
  getUserActiveSessions,
  removeSpecificSession
};