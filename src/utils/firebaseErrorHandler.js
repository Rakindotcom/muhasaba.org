// Firebase Error Handler
export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  switch (error.code) {
    case 'auth/configuration-not-found':
      return {
        message: 'Authentication service is not properly configured. Please contact support.',
        action: 'CONTACT_SUPPORT'
      };
    case 'auth/network-request-failed':
      return {
        message: 'Network error. Please check your internet connection.',
        action: 'RETRY'
      };
    case 'auth/too-many-requests':
      return {
        message: 'Too many failed attempts. Please try again later.',
        action: 'WAIT'
      };
    case 'auth/user-not-found':
      return {
        message: 'No account found with this email address.',
        action: 'SIGNUP'
      };
    case 'auth/wrong-password':
      return {
        message: 'Incorrect password. Please try again.',
        action: 'RETRY'
      };
    case 'auth/email-already-in-use':
      return {
        message: 'An account with this email already exists.',
        action: 'LOGIN'
      };
    case 'auth/weak-password':
      return {
        message: 'Password should be at least 6 characters.',
        action: 'RETRY'
      };
    case 'auth/invalid-email':
      return {
        message: 'Please enter a valid email address.',
        action: 'RETRY'
      };
    default:
      return {
        message: error.message || 'An unexpected error occurred.',
        action: 'RETRY'
      };
  }
};

export const getFirebaseErrorMessage = (error) => {
  const errorInfo = handleFirebaseError(error);
  return errorInfo.message;
};