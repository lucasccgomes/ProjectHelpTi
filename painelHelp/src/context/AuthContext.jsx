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
      setCurrentUser(storedUser);
      setIsAuthenticated(storedAuth === 'true');
    }
    setLoading(false);
  }, []);

  const logAllUsuarios = async () => {
    try {
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);

      querySnapshot.forEach(doc => {
         });
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    }
  };

  useEffect(() => {
    logAllUsuarios();
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
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', username);
            userFound = true;
          } else {
            console.log('Credenciais inválidas');
          }
        }
      });

      if (!userFound) {
        console.log('Usuário não encontrado no Firestore ou credenciais inválidas');
        throw new Error('User not found or invalid credentials');
      }
    } catch (error) {
      console.error('Erro ao tentar login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      console.log('Logout bem-sucedido');
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
