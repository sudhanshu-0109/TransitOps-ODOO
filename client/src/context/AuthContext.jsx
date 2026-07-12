import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        const userData = res.data.data;
        // getMe returns { role: { name: 'ADMIN' } } — flatten to { role: 'ADMIN' }
        setUser({ ...userData, role: userData.role?.name ?? userData.role });
      }
    } catch (err) {
      console.error('Failed to init auth', err);
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { accessToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    // login response already returns role as string 'ADMIN'
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Re-export api for backward compatibility with any files that import from AuthContext
export { default as api } from '../services/api';
