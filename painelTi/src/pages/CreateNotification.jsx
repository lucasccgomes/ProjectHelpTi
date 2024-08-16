import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Ajuste o caminho conforme necessário
import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Dropdown from '../components/Dropdown/Dropdown'; // Ajuste o caminho conforme necessário
import { useAuth } from '../context/AuthContext'; // Ajuste o caminho conforme necessário
import MyModal from '../components/Modal/MyModal';
import UserNotifications from '../components/UserNotifications/UserNotifications';

const CreateNotification = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenNewAlert, setIsModalOpenNewAlert] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        Object.keys(data).forEach((user) => {
          usersList.push(user);
        });
      });

      usersList.push('Todos'); // Adiciona a opção "Todos"
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const handleUserSelection = (selectedOption) => {
    if (selectedOption === 'Todos') {
      setSelectedUsers(['Todos']);
    } else {
      if (selectedUsers.includes('Todos')) return;

      const updatedSelection = selectedUsers.includes(selectedOption)
        ? selectedUsers.filter((user) => user !== selectedOption)
        : [...selectedUsers, selectedOption];

      setSelectedUsers(updatedSelection);
    }
  };

  const checkIfTitleExists = async (documentName) => {
    const docRef = doc(collection(db, 'ordersControl', 'avisos', 'docs'), documentName);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };

  const handleSubmit = async () => {
    if (!title || !message || selectedUsers.length === 0) {
      setModalMessage('Por favor, preencha todos os campos.');
      setIsModalOpen(true);
      return;
    }

    const userDocRef = doc(db, 'usuarios', currentUser.cidade);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data()[currentUser.user];

    const documentName = `${userData.user}-${userData.cargo}-${title}`;

    // Verificar se o título já existe
    const titleExists = await checkIfTitleExists(documentName);
    if (titleExists) {
      setModalMessage(`O título "${title}" já foi usado. Por favor, adicione outra identificação, como "${title}-01".`);
      setIsModalOpen(true);
      return;
    }

    const newNotification = {
      title,
      message,
      users: selectedUsers,
      status: 'on',
      confirm: [],
      usersDelet: [],
      createUser: userData.user,
    };

    try {
      const docRef = doc(collection(db, 'ordersControl', 'avisos', 'docs'), documentName);
      await setDoc(docRef, newNotification);

      // Exibir mensagem de sucesso
      setModalMessage('Notificação criada com sucesso!');
      setIsModalOpen(true);

      // Limpar os campos após o envio
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
    } catch (error) {
      console.error("Erro ao criar notificação: ", error);
      setModalMessage('Erro ao criar a notificação.');
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full h-full mx-auto pt-14 lg:pt-20 lg:p-4 bg-altBlue flex flex-col lg:flex-row lg:justify-between">

      <div className='max-w-md bg-white p-4 rounded-xl shadow-xl hidden lg:flex lg:flex-col'>
        <h2 className="text-2xl font-bold mb-4">Criar Alerta</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Digite o título"
          />
        </div>
        <div className="mb-4">
          <Dropdown
            options={users}
            label="Selecionar Usuários"
            selected={selectedUsers.length > 0 ? selectedUsers.join(', ') : 'Selecione...'}
            onSelectedChange={handleUserSelection}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
          <ReactQuill className='' theme="snow" value={message} onChange={setMessage} />
        </div>
        <button
          onClick={handleSubmit}
          className="bg-primaryBlueDark w-full text-white py-2 px-4 rounded hover:bg-primary"
        >
          Salvar Alerta
        </button>

      </div>

      {/* Modal de Alerta */}
      {isModalOpen && (
        <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="p-4">
            <p className='text-bold'>{modalMessage}</p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-primaryBlueDark text-white rounded hover:bg-blue-700"
            >
              Ok
            </button>
          </div>
        </MyModal>
      )}


      <div className='lg:hidden w-full flex justify-center items-center'>
        <button
          className="bg-primaryBlueDark w-full text-white py-2 px-4 rounded hover:bg-primary my-3 mx-2"
          onClick={() => setIsModalOpenNewAlert(true)}
        >
          Criar Alerta
        </button>
      </div>

      <div className='lg:h-max'>
        <UserNotifications />
      </div>

      {isModalOpenNewAlert && (
        <MyModal isOpen={isModalOpenNewAlert} onClose={() => setIsModalOpenNewAlert(false)}>
          <div className="p-4">
            <div className='max-w-md bg-white p-4 rounded-xl shadow-xl '>
              <h2 className="text-2xl font-bold mb-4">Criar Alerta</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Digite o título"
                />
              </div>
              <div className="mb-4">
                <Dropdown
                  options={users}
                  label="Selecionar Usuários"
                  selected={selectedUsers.length > 0 ? selectedUsers.join(', ') : 'Selecione...'}
                  onSelectedChange={handleUserSelection}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                <ReactQuill className='' theme="snow" value={message} onChange={setMessage} />
              </div>
              <button
                onClick={handleSubmit}
                className="bg-primaryBlueDark w-full text-white py-2 px-4 rounded hover:bg-primary"
              >
                Salvar Alerta
              </button>
            </div>
          </div>
        </MyModal>
      )}

    </div>
  );
};

export default CreateNotification;
