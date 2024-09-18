import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore'; 

const AuthContext = createContext(); // Cria o contexto de autenticação

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado para controlar se o usuário está autenticado
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento inicial
  const [currentUser, setCurrentUser] = useState(null); // Estado para armazenar os dados do usuário atual
  const [currentUserRole, setCurrentUserRole] = useState(''); // Estado para armazenar o cargo do usuário atual
  const navigate = useNavigate(); // Hook para navegação entre páginas

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser'); // Recupera o usuário armazenado no localStorage
    const storedAuth = localStorage.getItem('isAuthenticated'); // Recupera o estado de autenticação armazenado no localStorage
    const storedRole = localStorage.getItem('currentUserRole'); // Recupera o cargo do usuário armazenado no localStorage
    if (storedUser && storedAuth && storedRole) {
      setCurrentUser(JSON.parse(storedUser)); // Define o usuário atual com o objeto armazenado
      setIsAuthenticated(storedAuth === 'true'); // Define o estado de autenticação
      setCurrentUserRole(storedRole); // Define o cargo do usuário atual
    }
    setLoading(false); // Define o carregamento como concluído
  }, []);

  const login = async (username, password) => {
    try {
      const usuariosRef = collection(db, 'usuarios'); // Referência à coleção de usuários no Firestore
      const querySnapshot = await getDocs(usuariosRef); // Obtém todos os documentos da coleção de usuários
  
      let userFound = false; // Variável para verificar se o usuário foi encontrado
      querySnapshot.forEach(doc => {
        const userData = doc.data()[username]; // Obtém os dados do usuário específico
        if (userData) {
          if (userData.pass === password) { // Verifica se a senha está correta
            setIsAuthenticated(true); // Define o estado de autenticação como verdadeiro
            const user = {
              user: username, // Nome de usuário
              cidade: doc.id, // Cidade do usuário
              cargo: userData.cargo, // Cargo do usuário
              assignment: userData.assignment, // Atribuição do usuário
              loja: userData.loja, // Loja do usuário
              whatsapp: userData.whatsapp, // WhatsApp do usuário
              imageUrl: userData.imageUrl || '', // URL da imagem de perfil do usuário
              fullName: userData.fullName || '' // Adiciona o campo fullName ou vazio se não existir
            };
            
            setCurrentUser(user); // Define o usuário atual
            setCurrentUserRole(userData.cargo); // Define o cargo do usuário atual
            localStorage.setItem('isAuthenticated', 'true'); // Armazena o estado de autenticação no localStorage
            localStorage.setItem('currentUser', JSON.stringify(user)); // Armazena o objeto do usuário no localStorage
            localStorage.setItem('currentUserRole', userData.cargo); // Armazena o cargo do usuário no localStorage
            userFound = true; // Define que o usuário foi encontrado
  
            // Se fullName estiver vazio, abre o modal para pedir o nome completo
            if (!user.fullName) {
              // Aqui você pode abrir o modal, caso o fullName esteja vazio
              setIsNameModalOpen(true);
            }
          } else {
            console.log('Credenciais inválidas'); // Log se as credenciais forem inválidas
          }
        }
      });
  
      if (!userFound) {
        console.log('Usuário não encontrado ou credenciais inválidas'); // Log se o usuário não for encontrado
        throw new Error('Usuário não encontrado ou credenciais inválidas'); // Lança um erro se o usuário não for encontrado ou as credenciais forem inválidas
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error); // Loga o erro se o login falhar
      throw error; // Lança o erro para tratamento posterior
    }
  };
  
  
  const logout = async () => {
    try {
      setIsAuthenticated(false); // Define o estado de autenticação como falso
      setCurrentUser(null); // Limpa os dados do usuário atual
      setCurrentUserRole(''); // Limpa o cargo do usuário atual
      localStorage.removeItem('isAuthenticated'); // Remove o estado de autenticação do localStorage
      localStorage.removeItem('currentUser'); // Remove o objeto do usuário do localStorage
      localStorage.removeItem('currentUserRole'); // Remove o cargo do usuário do localStorage
      navigate('/login');  // Redireciona para a página de login após o logout
    } catch (error) {
      console.error('Erro ao fazer logout:', error); // Loga o erro se o logout falhar
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, currentUser, currentUserRole, setCurrentUser  }}>
      {children} {/* Renderiza os componentes filhos dentro do provedor de contexto */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext); // Hook para acessar o contexto de autenticação
};

export { AuthContext }; // Exporta o contexto de autenticação
