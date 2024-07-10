import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedUser && storedAuth) {
      setCurrentUser(storedUser);
      setIsAuthenticated(storedAuth === 'true');
    }
    setLoading(false);
  }, []);

  const logAllUsuarios = async () => {
    try {
      const adminTiDocRef = doc(db, 'usuarios', 'adminTi');
      const adminTiDoc = await getDoc(adminTiDocRef);

      if (adminTiDoc.exists()) {
        // Dados do documento "adminTi"
      }
    } catch (error) {
      // Erro ao buscar documentos
    }
  };

  useEffect(() => {
    logAllUsuarios();
  }, []);

  const login = async (username, password) => {
    try {
      const adminTiDocRef = doc(db, 'usuarios', 'adminTi');
      const adminTiDoc = await getDoc(adminTiDocRef);

      if (adminTiDoc.exists()) {
        const adminTiData = adminTiDoc.data();

        if (adminTiData[username] && adminTiData[username].pass === password) {
          setIsAuthenticated(true);
          setCurrentUser(username);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', username);
        } else {
          throw new Error('Credenciais inválidas');
        }
      } else {
        throw new Error('Documento não encontrado');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
    } catch (error) {
      // Erro ao tentar logout
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
