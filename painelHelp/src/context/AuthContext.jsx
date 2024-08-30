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
      setCurrentUser(JSON.parse(storedUser)); // Recupera o objeto do usuário completo, incluindo imageUrl
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
        console.log('Dados recuperados do Firestore:', doc.data()); // Verifica todos os dados do documento
        if (userData) {
          console.log('Dados específicos do usuário:', userData); // Verifica os dados do usuário específico
          if (userData.pass === password) {
            setIsAuthenticated(true);
            const user = {
              user: username,
              cidade: doc.id,
              cargo: userData.cargo,
              assignment: userData.assignment,
              loja: userData.loja,
              whatsapp: userData.whatsapp,
              imageUrl: userData.imageUrl || '' // Verifica e inclui imageUrl
            };
            console.log('Usuário logado com sucesso:', user); // Log para confirmar o objeto do usuário
            setCurrentUser(user);
            setCurrentUserRole(userData.cargo);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user)); // Armazena o objeto do usuário completo
            localStorage.setItem('currentUserRole', userData.cargo);
            userFound = true;
          } else {
            console.log('Credenciais inválidas');
          }
        }
      });
  
      if (!userFound) {
        console.log('Usuário não encontrado ou credenciais inválidas');
        throw new Error('Usuário não encontrado ou credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
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
      console.error('Erro ao fazer logout:', error);
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

export { AuthContext };
