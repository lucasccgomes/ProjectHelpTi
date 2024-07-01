import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        console.log('Usuário autenticado:', user);
        setIsAuthenticated(true);
      } else {
        console.log('Usuário não autenticado');
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Buscando dados do usuário no Firestore para:', username);
      // Fetch user credentials from Firebase Firestore
      const userDocRef = doc(db, 'usuarios/osvaldoCruz', username);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Dados do usuário encontrados:', userData);
        if (userData.user === username && userData.pass === password) {
          console.log('Credenciais válidas, tentando autenticar...');
          await signInWithEmailAndPassword(auth, userData.user, password);
          console.log('Autenticação bem-sucedida');
        } else {
          console.log('Credenciais inválidas');
          throw new Error('Invalid credentials');
        }
      } else {
        console.log('Usuário não encontrado no Firestore');
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Erro ao tentar login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Tentando fazer logout...');
      await signOut(auth);
      console.log('Logout bem-sucedido');
    } catch (error) {
      console.error('Erro ao tentar logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
