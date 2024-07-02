import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Placeholder for checking user authentication state
    setLoading(false);
  }, []);

  const logAllUsuarios = async () => {
    try {
      console.log('Buscando todos os dados na coleção "usuarios"...');
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);

      querySnapshot.forEach(doc => {
        console.log(`Documento encontrado: ${doc.id} => `, doc.data());
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
      console.log('Buscando dados do usuário no Firestore para:', username);
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);

      let userFound = false;
      querySnapshot.forEach(doc => {
        const userData = doc.data()[username];
        if (userData) {
          console.log('Dados do usuário encontrados:', userData);
          if (userData.pass === password) {
            console.log('Credenciais válidas, autenticando usuário...');
            setIsAuthenticated(true);
            setCurrentUser(username);
            console.log('Autenticação bem-sucedida');
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
      console.log('Tentando fazer logout...');
      setIsAuthenticated(false);
      setCurrentUser(null);
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
