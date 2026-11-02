import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const extractUser = (response) => {
  const payload = response?.data ?? response;
  // Support both { data: { user, token } } and { data: user } login responses.
  return payload?.user || payload?.employee || payload?.data?.user || payload?.data || payload || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(extractUser(currentUser));
    } catch (error) {
      console.error('Unable to restore logged-in user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const loggedInUser = extractUser(response);
    setUser(loggedInUser);

    // Keep the user object available after refresh if authService did not
    // already persist it itself.
    if (loggedInUser && !localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    }
    return response;
  };

  const logout = () => {
    try {
      authService.logout();
    } finally {
      // Ensure the client session is cleared even if the service only clears
      // one of these keys or its cleanup throws.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
