import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config.js';
import axios from 'axios';

const makeError = (message, code) => {
  const error = new Error(message);
  if (code) error.code = code;
  return error;
};

const assertFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw makeError(
      'Firebase is not configured for the frontend (VITE_FIREBASE_API_KEY missing). ' +
        'Set VITE_FIREBASE_* in client/.env and restart the dev server.',
      'auth/not-configured'
    );
  }
};

// Register admin record in MySQL database helper
const registerAdminInDatabase = async (uid, email, name) => {
  try {
    const baseURL =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1')
        ? (import.meta.env.VITE_API_BASE_URL || '/api')
        : '/api';

    await axios.post(`${baseURL}/auth/register-admin`, {
      firebase_uid: uid,
      email,
      name: name || 'Utsanova Administrator',
    });
  } catch (err) {
    console.error('[Database Admin Sync]:', err.message);
    throw err;
  }
};

/**
 * Sign in with Firebase Email and Password.
 * Only a genuine Firebase session is ever returned - there is no demo/offline fallback.
 */
export const signInAdmin = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  assertFirebaseConfigured();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const token = await userCredential.user.getIdToken();

    // Ensure admin is recognized in MySQL database
    await registerAdminInDatabase(userCredential.user.uid, cleanEmail, userCredential.user.displayName);

    return {
      user: userCredential.user,
      token,
    };
  } catch (err) {
    console.warn('[Firebase Auth Sign-In Attempt]:', err.code, err.message);

    // Map raw Firebase error codes to helpful, user-friendly messages
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
      throw makeError(
        `Invalid email or password for "${cleanEmail}". If this account is not registered yet, switch to "Create Admin Account" below or create the user in Firebase Console > Authentication > Users.`,
        err.code
      );
    } else if (err.code === 'auth/wrong-password') {
      throw makeError('Incorrect password. Please verify and try again.', err.code);
    } else if (err.code === 'auth/operation-not-allowed') {
      throw makeError(
        'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.',
        err.code
      );
    } else if (err.code === 'auth/too-many-requests') {
      throw makeError('Access temporarily disabled due to many failed attempts. Try again in a few moments.', err.code);
    }

    throw err;
  }
};

/**
 * Register a new Administrator with Firebase and sync with MySQL
 */
export const signUpAdmin = async (email, password, displayName = 'Admin User') => {
  const cleanEmail = (email || '').trim().toLowerCase();
  assertFirebaseConfigured();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    const token = await userCredential.user.getIdToken();

    // Save admin in MySQL database
    await registerAdminInDatabase(userCredential.user.uid, cleanEmail, displayName);

    return {
      user: userCredential.user,
      token,
    };
  } catch (err) {
    console.error('[Firebase Auth Sign-Up Error]:', err.code, err.message);

    if (err.code === 'auth/email-already-in-use') {
      throw makeError('An account with this email already exists. Please use "Sign In" instead.', err.code);
    } else if (err.code === 'auth/weak-password') {
      throw makeError('Password should be at least 6 characters long.', err.code);
    } else if (err.code === 'auth/operation-not-allowed') {
      throw makeError(
        'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.',
        err.code
      );
    }

    throw err;
  }
};

/**
 * Sign out administrator
 */
export const signOutAdmin = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Firebase SignOut]:', err.message);
  }
};

/**
 * Listen to Firebase Auth state
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, token: null, loading: false });
      return;
    }
    try {
      const token = await user.getIdToken();
      callback({ user, token, loading: false });
    } catch (e) {
      console.warn('[Firebase Auth] Could not obtain ID token:', e.message);
      callback({ user: null, token: null, loading: false });
    }
  });
};
