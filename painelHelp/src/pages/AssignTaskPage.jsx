import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import MyModal from '../components/MyModal/MyModal';
import Task from '../components/Task/Task';
import { BsFillSendPlusFill } from "react-icons/bs";
import { MdDeleteForever, MdCancel } from "react-icons/md";
import NotificationModal from '../components/NotificationModal/NotificationModal';
import { FaCheck } from "react-icons/fa";
import ReactQuill from 'react-quill'; // Importando React Quill
import 'react-quill/dist/quill.snow.css'; // Importando os estilos do Quill
import AlertModal from '../components/AlertModal/AlertModal';

// Configuração da toolbar do ReactQuill
const modules = {
  toolbar: [
    [{ 'font': [] }], // Fontes
    [{ 'size': [] }], // Tamanho da fonte
    [{ 'color': [] }], // Cores da fonte
    ['bold', 'italic'], // Negrito e Itálico
    [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Listas ordenadas e não ordenadas
    ['link'], // Hiperlink
  ]
};

const AssignTasksPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [atributeModalOpen, setAtributeModalOpen] = useState(false);
  const [concludeModalOpen, setConcludeModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState(''); // Usado pelo ReactQuill
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [conclusionDate, setConclusionDate] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [usersWithTasks, setUsersWithTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [showAssignedTasks, setShowAssignedTasks] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  const [orientation, setOrientation] = useState('');  // Adiciona o estado para orientação
  const [priority, setPriority] = useState(''); // Adiciona o estado para prioridade
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [changeDueDate, setChangeDueDate] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);  // ID da tarefa a ser excluída
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);  // Estado para o modal de confirmação
  const [difficulties, setDifficulties] = useState(''); // Estado para as dificuldades
  const [isCancelModalOpen, setCancelModalOpen] = useState(false); // Controle do modal de cancelamento
  const [descriptionCanceled, setDescriptionCanceled] = useState(''); // Controle da descrição do cancelamento
  const [selectedTaskForCancel, setSelectedTaskForCancel] = useState(null); // Controle da tarefa que está sendo cancelada
  const [showAllUsers, setShowAllUsers] = useState(false); // Novo estado para o checkbox


  const NOTIFICATION_API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const now = new Date();

    // Define o limite mínimo como 3 horas à frente da hora atual no fuso horário local
    const minDateTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Adiciona 3 horas à hora atual

    // Verifica se a data selecionada é hoje
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Se a data for hoje e a hora for menor que 3 horas a partir de agora, define a hora mínima
    if (isToday && selectedDate < minDateTime) {
      // Ajusta para o horário correto com base no fuso horário local
      const adjustedDate = new Date(minDateTime.getTime() - minDateTime.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16); // Converte para o formato correto sem aplicar UTC
      setNewTaskDueDate(adjustedDate);
    } else {
      // Caso contrário, mantém a data/hora selecionada
      setNewTaskDueDate(e.target.value);
    }
  };

  useEffect(() => {
    const unsubscribeTasks = fetchTasks();
    const unsubscribeAssignments = fetchAssignments();

    return () => {
      if (typeof unsubscribeTasks === 'function') unsubscribeTasks();
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
    };
  }, []);

  const fetchTasks = () => {
    try {
      const tasksCollection = collection(db, 'tarefas', currentUser.user, 'tasks');

      const unsubscribe = onSnapshot(tasksCollection, (snapshot) => {
        const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(tasksList);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  const handleDeleteTask = (taskId) => {
    setDeleteTaskId(taskId);  // Armazena o ID da tarefa
    setConfirmDeleteOpen(true);  // Abre o modal de confirmação
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      try {
        const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', deleteTaskId);
        await deleteDoc(taskRef);  // Exclui a tarefa do Firestore
      } catch (error) {
        console.error("Erro ao excluir a tarefa: ", error);
        setAlertTitle('Erro ao Excluir Tarefa');
        setAlertMessage('Ocorreu um erro ao tentar excluir a tarefa.');
        setAlertOpen(true);
      } finally {
        setDeleteTaskId(null);  // Limpa o ID da tarefa
        setConfirmDeleteOpen(false);  // Fecha o modal de confirmação
      }
    }
  };

  const fetchAssignments = () => {
    try {
      const citiesCollection = collection(db, 'usuarios');

      const unsubscribe = onSnapshot(citiesCollection, async (snapshot) => {
        const citiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usersList = [];

        for (const city of citiesList) {
          Object.keys(city).forEach(key => {
            if (typeof city[key] === 'object' && city[key].user) {
              // Adiciona todos os usuários à lista, independentemente de estarem atribuídos
              usersList.push({ id: key, ...city[key] });
            }
          });
        }

        // Atualiza a lista de todos os usuários
        setAllUsers(usersList);

        // Agora filtra apenas os usuários atribuídos
        const assignedUsers = usersList.filter(user => user.assignment === currentUser.user);

        const usersWithTasksPromises = assignedUsers.map(async (user) => {
          const userTasksCollection = collection(db, 'tarefas', user.user, 'tasks');

          return new Promise((resolve) => {
            onSnapshot(userTasksCollection, (userTasksSnapshot) => {
              const userTasksList = userTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              user.tasks = userTasksList;
              resolve(user);
            });
          });
        });

        const resolvedUsersWithTasks = await Promise.all(usersWithTasksPromises);
        setUsersWithTasks(resolvedUsersWithTasks.filter(user => user.tasks.length > 0));
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching assignments: ", error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle || !newTaskDescription || !newTaskDueDate || !priority) {
      setAlertTitle('Erro ao Criar Tarefa');
      setAlertMessage('Por favor, preencha todos os campos obrigatórios antes de criar a tarefa.');
      setAlertOpen(true);
      return;
    }

    const requesterName = currentUser.user; // Use o campo 'user' em vez de 'displayName'

    const taskId = uuidv4();
    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', taskId);
    await setDoc(taskRef, {
      id: taskId,
      task: newTaskTitle,
      description: newTaskDescription,
      status: 'pendente',
      dueDate: newTaskDueDate,
      priority: priority,
      requester: currentUser.user,
      requesterName: requesterName // Aqui estamos usando 'user' corretamente
    });

    setModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setPriority(''); // Limpa o campo de prioridade
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', taskId);
    await updateDoc(taskRef, {
      status: newStatus
    });
  };

  const handleAssignTask = (task) => {
    setSelectedTask(task);
    setAtributeModalOpen(true);
  };

  const sendNotification = async (tokens, notification) => {
    try {
      // Defina o corpo da requisição que será enviado ao backend
      const body = {
        tokens, // Array de tokens de dispositivos para os quais enviar notificações
        notification: {
          title: notification.title,
          body: notification.body,
          click_action: notification.click_action, // URL de redirecionamento ao clicar
          icon: notification.icon, // URL do ícone da notificação
        }
      };

      // Faça a requisição para o backend que vai encaminhar para o Firebase
      const response = await fetch(NOTIFICATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body) // Envia os dados em formato JSON
      });

      // Obtenha a resposta do servidor
      const responseData = await response.json();

      // Verifique se a resposta foi bem-sucedida
      if (response.ok) {
        console.log('Notificação enviada com sucesso.');
      } else {
        console.error('Falha ao enviar notificação. Status:', response.status);
        console.error('Resposta do servidor:', responseData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedUser || !orientation) {
      setAlertTitle('Erro ao Atribuir Tarefa');
      setAlertMessage('Por favor, selecione um usuário e preencha a orientação antes de atribuir a tarefa.');
      setAlertOpen(true);
      return;
    }
  
    if (selectedTask) {
      const oldTaskRef = doc(db, 'tarefas', currentUser.user, 'tasks', selectedTask.id);
      const newTaskRef = doc(db, 'tarefas', selectedUser, 'tasks', selectedTask.id);
  
      const updatedTask = {
        ...selectedTask,
        requesterName: selectedUser,  // Atualiza apenas o requesterName para o novo usuário
        orientation: orientation,  // Grava o campo orientação
      };
  
      // Se o checkbox estiver marcado e houver um novo prazo, atualiza o dueDate
      if (changeDueDate && newTaskDueDate) {
        updatedTask.dueDate = newTaskDueDate;
      }
  
      await setDoc(newTaskRef, updatedTask);
      await deleteDoc(oldTaskRef);
  
      // Fecha o modal imediatamente, antes de enviar a notificação
      setAtributeModalOpen(false);
      setSelectedTask(null);
      setSelectedUser('');
      setOrientation('');
      setChangeDueDate(false);  // Reseta o checkbox após salvar
      setNewTaskDueDate('');  // Reseta o campo de data
  
      // Agora envia a notificação sem depender do modal estar aberto
      try {
        const citiesSnapshot = await getDocs(collection(db, 'usuarios'));
        let userDocFound = null;
  
        for (const cityDoc of citiesSnapshot.docs) {
          const cityData = cityDoc.data();
  
          if (cityData[selectedUser]) {
            userDocFound = cityData[selectedUser];
            console.log("Usuário encontrado na cidade:", cityDoc.id);
            console.log("Dados do usuário:", userDocFound);
  
            const userTokenArray = userDocFound.token;
  
            if (userTokenArray && userTokenArray.length > 0) {
              const userToken = userTokenArray[0]; // Extraia o token do array
  
              const notification = {
                title: "Você tem uma nova tarefa",
                body: `Uma nova tarefa foi atribuída a você: ${selectedTask.task}`,
                click_action: "https://drogalira.com.br/atribute", // URL de redirecionamento
                icon: "https://iili.io/duTTt8Q.png" // URL do ícone da notificação
              };
  
              // Envia a notificação
              await sendNotification([userToken], notification); // Envia o array de tokens (mesmo que seja 1)
            } else {
              console.error("Token não encontrado para o usuário:", selectedUser);
            }
            break;
          }
        }
  
        if (!userDocFound) {
          console.error("Usuário não encontrado em nenhuma cidade:", selectedUser);
        }
      } catch (error) {
        console.error("Erro ao buscar o documento do usuário:", error);
      }
    }
  };

  const handleConcludeTask = (task) => {
    setSelectedTask(task);
    setConcludeModalOpen(true);
  };

  // Função para abrir o modal de cancelamento
  const handleOpenCancelModal = (task) => {
    setSelectedTaskForCancel(task); // Armazena a tarefa selecionada
    setCancelModalOpen(true); // Abre o modal
  };

  // Função para salvar o cancelamento e atualizar o status
  const handleCancelTask = async () => {
    if (!descriptionCanceled || descriptionCanceled.trim() === '') {
      setAlertTitle('Motivo de Cancelamento Obrigatório');
      setAlertMessage('Por favor, preencha o motivo do cancelamento antes de continuar.');
      setAlertOpen(true);
      return;
    }

    const canceledDate = new Date().toISOString(); // Pega a data atual

    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', selectedTaskForCancel.id);
    await updateDoc(taskRef, {
      status: 'cancelado', // Atualiza o status para "cancelado"
      descriptionCanceled: descriptionCanceled, // Salva o motivo do cancelamento
      canceledDate: canceledDate // Salva a data do cancelamento
    });

    setCancelModalOpen(false); // Fecha o modal
    setDescriptionCanceled(''); // Limpa o campo
    setSelectedTaskForCancel(null); // Limpa a tarefa selecionada
  };

  const handleSaveConclusion = async () => {
    const conclusionDate = new Date().toISOString(); // Pega a data atual automaticamente  
    if (selectedTask && conclusionDate) {
      const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', selectedTask.id);
      await updateDoc(taskRef, {
        status: 'concluido',
        conclusionDate: conclusionDate,
        difficulties: difficulties  // Salva as dificuldades
      });

      setConcludeModalOpen(false);
      setSelectedTask(null);
      setConclusionDate('');
      setDifficulties('');  // Limpa o campo de dificuldades após salvar
    }
  };

  const handleUserSelect = (e) => {
    const selectedUserId = e.target.value;
    setSelectedUser(selectedUserId);
    setIsToggleEnabled(!!selectedUserId);
  };

  return (
    <div className="flex bg-altBlue w-full">
      <div className="flex mt-14 w-full h-full">
        <div className='p-4 mt-4 w-full'>
          <div className='flex flex-col lg:flex-row gap-2 justify-center items-center'>
            <div>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setModalOpen(true);
                }}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Criar Tarefa
              </button>

              <select
                value={selectedUser}
                onChange={handleUserSelect}
                className="ml-4 p-2 border rounded"
              >
                <option value="">Selecione um usuário</option>
                {usersWithTasks.length > 0 ? (
                  usersWithTasks.map(user => (
                    <option key={user.id} value={user.user}>
                      {user.user} - {user.cargo}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Nenhum usuário disponível
                  </option>
                )}
              </select>
            </div>
            <div>
              <button
                onClick={() => setShowAssignedTasks(!showAssignedTasks)}
                className={`ml-4 bg-${showAssignedTasks ? 'red' : 'green'}-500 text-white p-2 rounded`}
                disabled={!isToggleEnabled}
              >
                {showAssignedTasks ? 'Mostrar Minhas Tarefas' : 'Mostrar Tarefas Atribuídas'}
              </button>
            </div>
          </div>

          {showAssignedTasks && selectedUser
            ? (
              <div className="mt-4 w-full">
                {usersWithTasks
                  .filter(user => user.user === selectedUser)
                  .map(user => (
                    <div key={`user-${user.id}`} className="mb-2 p-4 w-full">
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                        {user.tasks.map(task => (
                          <div key={`task-${task.id}-${user.id}`} className="p-2 rounded">
                            <h3 className="font-semibold text-white">
                              {user.user} - {user.cargo}
                            </h3>
                            <Task task={task} onStatusChange={handleStatusChange} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )
            : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                  <div key={task.id} className="">
                    <Task task={task} onStatusChange={handleStatusChange} />
                    <div className='bg-white rounded-b-xl flex justify-between px-4 pb-2'>
                      <div className='bg-primaryBlueDark w-full rounded-b-xl pb-2 flex justify-between px-2'>
                        <button
                          onClick={() => handleAssignTask(task)}
                          className={`text-white p-2 rounded mt-2 ${task.status === 'concluido' || task.requestSender || task.status === 'cancelado' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500'}`}
                          disabled={task.status === 'concluido' || task.requestSender || task.status === 'cancelado'}
                        >
                          <BsFillSendPlusFill className='text-xl' />
                        </button>

                        <button
                          onClick={() => handleConcludeTask(task)}
                          className={`text-white p-2 rounded mt-2 ml-2 ${task.status === 'concluido' || task.status === 'cancelado' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500'}`}
                          disabled={task.status === 'concluido' || task.status === 'cancelado'}
                        >
                          <FaCheck className='text-xl' />
                        </button>

                        {/* Botão de Excluir */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className={`text-white p-2 rounded mt-2 ml-2 ${(task.requestSender || task.status === 'concluido' || task.status === 'cancelado' || task.orientation) ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500'}`}
                          disabled={task.requestSender || task.status === 'concluido' || task.status === 'cancelado' || task.orientation}
                        >
                          <MdDeleteForever className='text-xl' />
                        </button>

                        {/* Botão de Cancelar */}
                        <button
                          onClick={() => handleOpenCancelModal(task)}
                          className={`text-white p-2 rounded mt-2 ml-2 ${task.status === 'concluido' || task.status === 'cancelado' ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500'}`}
                          disabled={task.status === 'concluido' || task.status === 'cancelado'} // Desativa o botão se a tarefa já estiver cancelada ou concluída
                        >
                          <MdCancel className='text-xl' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            )}
        </div>
      </div>

      <MyModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Criar Tarefa</h3>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Título da Tarefa"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}  // Corrigido aqui
            className="w-full p-2 border rounded mb-2"
          />
          <ReactQuill
            value={newTaskDescription}
            onChange={setNewTaskDescription}
            modules={modules}
            className="mb-4 h-32"
          />

          {/* Select para Prioridade */}
          <div className="mb-4 pt-16">
            <label className="text-lg font-medium leading-6 text-gray-900">Nível de Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Selecione a prioridade</option>
              <option value="baixa">Baixa</option>
              <option value="média">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <input
              type="datetime-local"
              value={newTaskDueDate}
              onChange={handleDateChange}
              className="w-full p-2 border rounded mb-2"
              min={new Date().toISOString().slice(0, 16)} // Define o mínimo como a data e hora atuais
            />
            <p className='text-xs text-center bg-red-500 text-white p-1 rounded-lg'>
              A hora selecionada deve ser pelo menos 3 horas à frente do horário atual.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded"
            onClick={handleCreateTask}
          >
            Salvar
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={atributeModalOpen} onClose={() => setAtributeModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Atribuir Tarefa</h3>
        <div className="mt-8">
          {/* Checkbox para mostrar todos os usuários */}
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={showAllUsers} // Estado que controla o checkbox
              onChange={() => {
                const newShowAllUsers = !showAllUsers;
                setShowAllUsers(newShowAllUsers); // Alterna o estado
                console.log('Checkbox alterado. Mostrar todos os usuários:', newShowAllUsers); // Adiciona log
              }}
            />
            <span className="ml-2">Mostrar todos os usuários</span>
          </label>

          {/* Select para escolher o usuário */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="">Selecione um usuário</option>
            {allUsers.length > 0 ? (
              showAllUsers ? (
                // Mostra todos os usuários quando o checkbox está marcado
                allUsers.map(user => (
                  <option key={user.id} value={user.user}>
                    {user.user} - {user.cargo}
                  </option>
                ))
              ) : (
                // Mostra apenas os usuários atribuídos quando o checkbox não está marcado
                allUsers
                  .filter(user => user.assignment === currentUser.user)
                  .map(user => (
                    <option key={user.id} value={user.user}>
                      {user.user} - {user.cargo}
                    </option>
                  ))
              )
            ) : (
              <option value="" disabled>
                Nenhum usuário disponível
              </option>
            )}
          </select>
          {console.log('Quantidade total de usuários:', allUsers.length)} {/* Log para verificar quantos usuários existem no total */}
          {console.log('Usuários:', allUsers)} {/* Log para inspecionar os dados brutos de usuários */}
        </div>

        {/* Checkbox para alterar o prazo */}
        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={changeDueDate}
              onChange={() => {
                const newChangeDueDate = !changeDueDate;
                setChangeDueDate(newChangeDueDate);
                console.log('Checkbox "Alterar Prazo" alterado. Novo valor:', newChangeDueDate); // Log para checkbox de data
              }}
            />
            <span className="ml-2">Alterar Prazo</span>
          </label>
        </div>

        {/* Mostrar input de data se o checkbox "Alterar Prazo" estiver selecionado */}
        {changeDueDate && (
          <div className="mt-4">
            <input
              type="datetime-local"
              value={newTaskDueDate}
              onChange={(e) => {
                setNewTaskDueDate(e.target.value);
                console.log('Nova data de vencimento da tarefa:', e.target.value); // Log para o campo de data
              }}
              className="w-full p-2 border rounded mb-2"
              min={new Date().toISOString().slice(0, 16)} // Define o mínimo como a data e hora atuais
            />
            <p className="text-xs text-center bg-red-500 text-white p-1 rounded-lg">
              A hora selecionada deve ser pelo menos 3 horas à frente do horário atual.
            </p>
          </div>
        )}

        {/* Campo de orientação com ReactQuill */}
        <div className="mt-4 mb-16">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Orientação</h3>
          <ReactQuill
            value={orientation}
            onChange={setOrientation}
            modules={modules}
            className="mb-4 h-32"
          />
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="bg-blue-500 text-white p-2 rounded"
            onClick={handleSaveAssignment}
          >
            Salvar
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={concludeModalOpen} onClose={() => setConcludeModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Concluir Tarefa</h3>
          {/* Campo de ReactQuill para as dificuldades */}
          <div className="mt-4 mb-16">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Dificuldades Enfrentadas <span className="text-red-500">*</span></h3>
            <ReactQuill
              value={difficulties}
              onChange={setDifficulties}
              modules={modules}
              className="mb-4 h-32"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="bg-blue-500 text-white p-2 rounded"
              onClick={() => {
                if (!difficulties || difficulties.trim() === '') {
                  // Exibe alerta se o campo estiver vazio
                  setAlertTitle('Erro');
                  setAlertMessage('O campo "Dificuldades Enfrentadas" é obrigatório.');
                  setAlertOpen(true);
                } else {
                  // Chama a função de salvar conclusão se tudo estiver preenchido
                  handleSaveConclusion();
                }
              }}
            >
              Salvar
            </button>
          </div>
        </>
      </MyModal>

      <MyModal isOpen={isCancelModalOpen} onClose={() => setCancelModalOpen(false)}>
        <h3 className="text-xl font-medium leading-6 text-gray-900">Cancelar Tarefa</h3>
        <div className="mt-4">
          <ReactQuill
            value={descriptionCanceled}
            onChange={setDescriptionCanceled}
            modules={modules} // Você pode usar a mesma configuração de toolbar do ReactQuill
            className="mb-4 mt-5 h-32"
            placeholder="Descreva o motivo do cancelamento"
          />
        </div>
        <div className="mt-16 flex justify-end">
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={handleCancelTask}
          >
            Confirmar Cancelamento
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Confirmar Exclusão</h3>
        <p className="mt-2">Tem certeza de que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</p>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-gray-400 text-white p-2 rounded mr-2"
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={confirmDelete}
          >
            Excluir
          </button>
        </div>
      </MyModal>

      <AlertModal
        isOpen={alertOpen}
        onRequestClose={() => setAlertOpen(false)}
        title={alertTitle}  // Passa o título dinâmico
        message={alertMessage}
      />

      <NotificationModal />
    </div>
  );
};

export default AssignTasksPage;
