import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedUser && storedAuth) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(storedAuth === 'true');
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const usuariosCollection = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosCollection);

      if (!querySnapshot.empty) {
        let userFound = false;

        querySnapshot.forEach((doc) => {
          const usuarios = doc.data();
          for (const [key, userData] of Object.entries(usuarios)) {
            if (userData.user === username && userData.cargo === 'T.I') {
              if (userData.pass === password) {
                setIsAuthenticated(true);
                const userInfo = { id: key, ...userData };
                setCurrentUser(userInfo);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify(userInfo));
                userFound = true;
                break;
              } else {
                throw new Error('Credenciais inválidas');
              }
            }
          }
        });

        if (!userFound) {
          throw new Error('Usuário não encontrado ou sem permissão');
        }
      } else {
        throw new Error('Nenhum documento encontrado na coleção usuarios');
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
      console.error('Erro ao tentar logout:', error);
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
