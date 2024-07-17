import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedRole = localStorage.getItem('currentUserRole');
    if (storedUser && storedAuth && storedRole) {
      setCurrentUser(storedUser);
      setIsAuthenticated(storedAuth === 'true');
      setCurrentUserRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);

      let userFound = false;
      querySnapshot.forEach(doc => {
        const userData = doc.data()[username];
        if (userData) {
          if (userData.pass === password) {
            setIsAuthenticated(true);
            setCurrentUser(username);
            setCurrentUserRole(userData.cargo);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', username);
            localStorage.setItem('currentUserRole', userData.cargo);
            userFound = true;
          } else {
            console.log('Invalid credentials');
          }
        }
      });

      if (!userFound) {
        console.log('User not found or invalid credentials');
        throw new Error('User not found or invalid credentials');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentUserRole('');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserRole');
      navigate('/login');  // Redireciona para a página de login após o logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, currentUser, currentUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
