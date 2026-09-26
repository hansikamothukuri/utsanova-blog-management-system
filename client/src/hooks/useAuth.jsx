import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAdmin, signUpAdmin, signOutAdmin, subscribeToAuthChanges } from '../firebase/auth.js';
import { setAuthToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from sessionStorage for instant state hydration
  useEffect(() => {
    const savedToken = sessionStorage.getItem('utsanova_auth_token');
    const savedUser = sessionStorage.getItem('utsanova_admin_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setTokenState(savedToken);
        setAuthToken(savedToken);
      } catch (e) {
        console.warn('Failed to parse saved user:', e);
      }
    }

    // Subscribe to Firebase Auth state listener
    const unsubscribe = subscribeToAuthChanges(async (state) => {
      if (state.user && state.token) {
        setUser(state.user);
        setTokenState(state.token);
        setAuthToken(state.token);
        sessionStorage.setItem('utsanova_auth_token', state.token);
        sessionStorage.setItem(
          'utsanova_admin_user',
          JSON.stringify({
            uid: state.user.uid,
            email: state.user.email,
            displayName: state.user.displayName || 'Administrator',
          })
        );
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInAdmin(email, password);
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Administrator',
      };
      setUser(userObj);
      setTokenState(result.token);
      setAuthToken(result.token);
      sessionStorage.setItem('utsanova_auth_token', result.token);
      sessionStorage.setItem('utsanova_admin_user', JSON.stringify(userObj));
      return result;
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signUpAdmin(email, password, displayName);
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || displayName || 'Administrator',
      };
      setUser(userObj);
      setTokenState(result.token);
      setAuthToken(result.token);
      sessionStorage.setItem('utsanova_auth_token', result.token);
      sessionStorage.setItem('utsanova_admin_user', JSON.stringify(userObj));
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutAdmin();
    } finally {
      setUser(null);
      setTokenState(null);
      setAuthToken(null);
      sessionStorage.removeItem('utsanova_auth_token');
      sessionStorage.removeItem('utsanova_admin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        error,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
