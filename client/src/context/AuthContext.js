import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Point all axios requests at our Flask backend
axios.defaults.baseURL = 'http://localhost:5555';
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if a session cookie already exists
  useEffect(() => {
    axios.get('/check_session')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    axios.delete('/logout').finally(() => setUser(null));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so any component can access auth state with one line
export function useAuth() {
  return useContext(AuthContext);
}