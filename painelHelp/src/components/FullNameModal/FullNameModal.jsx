import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Certifique-se de que o caminho está correto
import { useAuth } from '../../context/AuthContext'; // Certifique-se de que o caminho está correto
import MyModal from '../MyModal/MyModal'; // Certifique-se de que o caminho está correto

const FullNameModal = () => {
    const { currentUser, setCurrentUser } = useAuth(); // Acessa o usuário atual e função para atualizar
    const [isModalOpen, setIsModalOpen] = useState(false); // Controla o estado do modal
    const [fullName, setFullName] = useState(''); // Estado para armazenar o nome completo
    const [error, setError] = useState(''); // Controla as mensagens de erro
  
    // Verifica se o fullName está vazio ao carregar o componente
    useEffect(() => {
      if (!currentUser.fullName || currentUser.fullName.trim() === '') {
        setIsModalOpen(true); // Abre o modal se o fullName estiver vazio
      } else {
        setFullName(currentUser.fullName); // Sincroniza o estado com o currentUser
      }
    }, [currentUser]);
  
    // Função para salvar o nome completo no Firestore e no localStorage
    const handleSave = async () => {
      if (!fullName.trim()) {
        setError('O nome completo é obrigatório.'); // Exibe erro se o campo estiver vazio
        return;
      }
  
      try {
        // Referência ao documento do usuário no Firestore
        const userRef = doc(db, 'usuarios', currentUser.cidade);
  
        // Atualiza o fullName no Firestore
        await updateDoc(userRef, {
          [`${currentUser.user}.fullName`]: fullName,
        });
  
        // Atualiza o estado do currentUser com o fullName atualizado
        const updatedUser = { ...currentUser, fullName };
        setCurrentUser(updatedUser);
  
        // Atualiza o currentUser no localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  
        setIsModalOpen(false); // Fecha o modal
      } catch (error) {
        console.error('Erro ao salvar o nome completo:', error);
      }
    };
  
    return (
      <MyModal isOpen={isModalOpen} showCloseButton={false} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Insira seu nome completo</h2>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError(''); // Limpa a mensagem de erro ao digitar
            }}
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Nome completo"
          />
          {error && <p className="text-red-500 mt-2">{error}</p>} {/* Exibe o erro se existir */}
  
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      </MyModal>
    );
  };
  
  export default FullNameModal;
