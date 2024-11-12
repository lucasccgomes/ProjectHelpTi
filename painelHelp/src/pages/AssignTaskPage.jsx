import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Select from 'react-select'; // Importa o react-select
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
import { BsPlus } from "react-icons/bs";
import { MdOutlineAddTask, MdToggleOff, MdToggleOn } from "react-icons/md";

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
  const [markers, setMarkers] = useState([]);
  const [newMarker, setNewMarker] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#000000'); // Valor padrão de cor preta
  const [selectedMarker, setSelectedMarker] = useState('');
  const [selectedFilterMarker, setSelectedFilterMarker] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pendente'); // Novo estado para o filtro de status
  const [formattedUsers, setFormattedUsers] = useState([]);

  const filteredTasks = selectedFilterMarker
    ? tasks.filter(task => task.marker === selectedFilterMarker && task.status === selectedStatus)
    : tasks.filter(task => task.status === selectedStatus);

  const NOTIFICATION_API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;

  const fetchTasksForSelectedUserWithRequester = async (userId) => {
    try {
      const tasksCollection = collection(db, 'tarefas', userId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksForSelectedUser = tasksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => task.requester === currentUser.user);

      setUsersWithTasks([{ user: userId, tasks: tasksForSelectedUser }]);
    } catch (error) {
      console.error("Erro ao buscar tarefas para o usuário selecionado:", error);
    }
  };

  const fetchUsersWithLoggedUserTasks = async () => {
    try {
      const allUsersWithTasks = [];
      const usersCollection = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersCollection);

      // Itera sobre cada documento de cidade dentro da coleção `usuarios`
      for (const cityDoc of usersSnapshot.docs) {
        const cityData = cityDoc.data();

        // Itera sobre cada campo (usuário) dentro do documento da cidade
        for (const userId in cityData) {
          const userData = cityData[userId];
          if (userData && userData.user) {
            // Busca as tarefas de cada usuário para verificar o campo `requester`
            const tasksCollection = collection(db, 'tarefas', userData.user, 'tasks');
            const tasksSnapshot = await getDocs(tasksCollection);
            const userTasks = tasksSnapshot.docs.map(doc => doc.data());

            // Verifica se alguma tarefa tem `requester` igual ao usuário logado
            const hasTaskFromLoggedUser = userTasks.some(task => task.requester === currentUser.user);
            if (hasTaskFromLoggedUser) {
              allUsersWithTasks.push({ value: userData.user, label: `${userData.user} - ${userData.cargo || ''}` });
            }
          }
        }
      }

      setFormattedUsers(allUsersWithTasks);
    } catch (error) {
      console.error("Erro ao buscar usuários com tarefas do usuário logado:", error);
    }
  };

  useEffect(() => {
    fetchUsersWithLoggedUserTasks();
  }, [currentUser.user]);

  // Função para buscar todos os usuários dentro da coleção `usuarios` e armazená-los em uma lista
  const fetchAllUsers = async () => {
    try {
      const usersCollection = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersCollection);
      const allUsers = [];

      // Itera sobre cada documento de cidade dentro da coleção `usuarios`
      for (const cityDoc of usersSnapshot.docs) {
        const cityData = cityDoc.data();

        // Itera sobre cada campo (usuário) dentro do documento da cidade
        Object.keys(cityData).forEach(userId => {
          const userData = cityData[userId];
          if (userData && userData.user) {
            allUsers.push(userData.user); // Armazena o nome do usuário
          }
        });
      }

      return allUsers;
    } catch (error) {
      console.error("Erro ao buscar todos os usuários:", error);
      return [];
    }
  };

  // Função para buscar e exibir todas as tarefas de um usuário específico
  const fetchTasksForUser = async (userId) => {
    try {
      // Acessa a subcoleção `tasks` dentro do documento `tarefas/{userId}`
      const tasksCollection = collection(db, 'tarefas', userId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);

    } catch (error) {
      console.error(`Erro ao buscar tarefas para o usuário ${userId}:`, error);
    }
  };

  // Função principal para buscar todos os usuários e, em seguida, buscar tarefas para cada um
  const fetchAllUsersAndTasks = async () => {
    const allUsers = await fetchAllUsers(); // Pega todos os usuários

    for (const userId of allUsers) {
      await fetchTasksForUser(userId); // Busca tarefas para cada usuário
    }
  };

  useEffect(() => {
    fetchAllUsersAndTasks();
  }, []);

  // Função para buscar marcadores específicos do usuário no Firebase
  const fetchMarkers = async () => {
    try {
      const markersDocRef = doc(db, 'ordersControl', 'marcadoresTarefas', currentUser.user, 'marker');
      const docSnap = await getDoc(markersDocRef);

      if (docSnap.exists()) {
        const markersData = docSnap.data().array || [];
        setMarkers(markersData);
      } else {
        console.log("Documento de marcadores não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar marcadores: ", error);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  // Formatação das opções do select
  const formattedMarkers = markers.map(marker => ({
    value: marker.label,
    label: marker.label,
    color: marker.color
  }));

  // Estilos customizados para o react-select
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color,
      color: 'white',
      padding: 10,
      cursor: 'pointer',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      backgroundColor: state.data.color,
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
    }),
    control: (provided, state) => ({
      ...provided,
      cursor: 'pointer',
      opacity: state.isDisabled ? 0.5 : 1,  // Define opacidade quando desabilitado
      backgroundColor: state.isDisabled ? '#f3f3f3' : 'white',  // Altera a cor do fundo quando desabilitado
    })
  };

  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  // Função para adicionar novo marcador ao Firebase para o usuário atual
  const addMarker = async () => {
    if (newMarker.trim() !== '' && newMarkerColor) { // Verifica se a cor foi escolhida
      const markersDocRef = doc(db, 'ordersControl', 'marcadoresTarefas', currentUser.user, 'marker');
      try {
        const docSnap = await getDoc(markersDocRef);

        const newMarkerObject = { label: newMarker, color: newMarkerColor };

        // Verifica se já existe um marcador com o mesmo label
        const existingMarker = docSnap.exists() && docSnap.data().array.some(marker => marker.label === newMarker);

        if (existingMarker) {
          console.log("Erro: Marcador com esse label já existe.");
          return; // Não prossegue se já existir um marcador com o mesmo label
        }

        if (!docSnap.exists()) {
          await setDoc(markersDocRef, { array: [newMarkerObject] });
        } else {
          const updatedMarkers = [...docSnap.data().array, newMarkerObject];
          await updateDoc(markersDocRef, { array: updatedMarkers });
        }

        setMarkers(prevMarkers => [...prevMarkers, newMarkerObject]);
        setNewMarker('');
        setNewMarkerColor('#000000');
      } catch (error) {
        console.error("Erro ao adicionar marcador: ", error);
      }
    }
  };

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
              usersList.push({ id: key, ...city[key] });
            }
          });
        }

        setAllUsers(usersList);

        // Filtrando e atribuindo usuários com tarefas
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
    if (!newTaskTitle || !newTaskDescription || !newTaskDueDate || !priority || !selectedMarker) {
      setAlertTitle('Erro ao Criar Tarefa');
      setAlertMessage('Por favor, preencha todos os campos obrigatórios, incluindo o marcador, antes de criar a tarefa.');
      setAlertOpen(true);
      return;
    }

    const requesterName = currentUser.user; // Use o campo 'user' em vez de 'displayName'

    const selectedMarkerObject = markers.find(marker => marker.label === selectedMarker);

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
      marker: selectedMarkerObject.label,  // Salva o label do marcador
      markerColor: selectedMarkerObject.color  // Salva a cor do marcador
    });

    setModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setPriority('');
    setSelectedMarker('');
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', taskId);

    // Atualiza o status da tarefa
    await updateDoc(taskRef, {
      status: newStatus
    });

    // Agora, vamos enviar uma notificação para o usuário que está no campo "requester"
    try {
      const taskSnapshot = await getDoc(taskRef); // Obtém os detalhes da tarefa
      const taskData = taskSnapshot.data();
      const requester = taskData.requester; // Obtém o campo "requester"

      // Agora, buscamos o token do requester
      const citiesSnapshot = await getDocs(collection(db, 'usuarios'));
      let userDocFound = null;

      for (const cityDoc of citiesSnapshot.docs) {
        const cityData = cityDoc.data();

        if (cityData[requester]) {
          userDocFound = cityData[requester];

          const userTokenArray = userDocFound.token;

          if (userTokenArray && userTokenArray.length > 0) {
            const userToken = userTokenArray[0]; // Pega o token do usuário

            // Configura a notificação
            const notification = {
              title: "Atualização de status da tarefa",
              body: `O status da sua tarefa foi alterado para: ${newStatus}`,
              click_action: "https://drogalira.com.br/atribute", // URL de redirecionamento
              icon: "https://iili.io/duTTt8Q.png" // URL do ícone da notificação
            };

            // Envia a notificação
            await sendNotification([userToken], notification); // Envia a notificação para o token do usuário
          } else {
            console.error("Token não encontrado para o usuário:", requester);
          }
          break;
        }
      }

      if (!userDocFound) {
        console.error("Usuário não encontrado:", requester);
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de status:", error);
    }
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

      // Cria uma cópia da tarefa sem os campos marker e markerColor
      const updatedTask = {
        ...selectedTask,
        requesterName: selectedUser,  // Atualiza o requesterName para o novo usuário
        orientation: orientation,     // Grava o campo orientação
        dueDate: changeDueDate && newTaskDueDate ? newTaskDueDate : selectedTask.dueDate, // Atualiza o prazo se necessário
      };

      // Remove os campos marker e markerColor
      delete updatedTask.marker;
      delete updatedTask.markerColor;

      // Salva a tarefa para o novo usuário e apaga a tarefa antiga
      await setDoc(newTaskRef, updatedTask);
      await deleteDoc(oldTaskRef);

      // Fecha o modal e redefine os campos
      setAtributeModalOpen(false);
      setSelectedTask(null);
      setSelectedUser('');
      setOrientation('');
      setChangeDueDate(false);
      setNewTaskDueDate('');

      // Envia notificação para o novo usuário
      try {
        const citiesSnapshot = await getDocs(collection(db, 'usuarios'));
        let userDocFound = null;

        for (const cityDoc of citiesSnapshot.docs) {
          const cityData = cityDoc.data();

          if (cityData[selectedUser]) {
            userDocFound = cityData[selectedUser];
            const userTokenArray = userDocFound.token;

            if (userTokenArray && userTokenArray.length > 0) {
              const userToken = userTokenArray[0]; // Token do usuário

              const notification = {
                title: "Você tem uma nova tarefa",
                body: `Uma nova tarefa foi atribuída a você: ${selectedTask.task}`,
                click_action: "https://drogalira.com.br/atribute",
                icon: "https://iili.io/duTTt8Q.png"
              };

              await sendNotification([userToken], notification);
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
          <div className='flex flex-col lg:flex-row gap-2 justify-center items-center p-4 rounded-md shadow bg-primaryBlueDark'>
            <div className='flex gap-2 justify-between items-center '>

              <button
                onClick={() => {
                  setSelectedTask(null);
                  setModalOpen(true);
                }}
                className="bg-green-800 shadow text-white p-2 rounded"
              >
                <MdOutlineAddTask className='text-2xl' />
              </button>

              <div className="w-56">
                <Select
                  options={formattedMarkers}
                  value={formattedMarkers.find(marker => marker.value === selectedFilterMarker)}
                  onChange={(selectedOption) => setSelectedFilterMarker(selectedOption ? selectedOption.value : null)}
                  styles={customStyles}
                  isClearable
                  placeholder="Marcador para filtrar"
                  isDisabled={showAssignedTasks}  // Desabilita o seletor quando `showAssignedTasks` estiver ativo
                />
              </div>

              <Select
                options={statusOptions}
                value={statusOptions.find(option => option.value === selectedStatus)}
                onChange={(selectedOption) => setSelectedStatus(selectedOption.value)}
                placeholder="Status da Tarefa"
                className="w-56 ml-4"
                isClearable={false}  // Remove a opção de limpar para sempre ter um status
              />

              <div className='flex justify-center items-center bg-altBlue rounded-md'>
                <Select
                  options={formattedUsers} // Agora utiliza o estado `formattedUsers` filtrado
                  value={formattedUsers.find(user => user.value === selectedUser)}
                  onChange={(selectedOption) => {
                    setSelectedUser(selectedOption ? selectedOption.value : '');
                    setIsToggleEnabled(!!selectedOption);
                  }}
                  placeholder="Selecione um usuário"
                  isClearable
                  className="w-56 ml-4"
                />
                <button
                  onClick={() => {
                    const newShowAssignedTasks = !showAssignedTasks;
                    setShowAssignedTasks(newShowAssignedTasks);

                    if (newShowAssignedTasks && selectedUser) {
                      fetchTasksForSelectedUserWithRequester(selectedUser);
                    } else {
                      setUsersWithTasks([]); // Limpa a lista de tarefas se o botão for desativado
                    }
                  }}
                  disabled={!isToggleEnabled}
                >
                  {showAssignedTasks ? <MdToggleOn className='text-green-600 text-5xl' /> : <MdToggleOff className='text-red-600 text-5xl' />}
                </button>
              </div>
            </div>
          </div>

          {showAssignedTasks && selectedUser && usersWithTasks.length > 0
            ? (
              <div className="mt-4 w-full">
                {usersWithTasks.map(user => (
                  <div key={`user-${user.id}`} className="mb-2 p-4 w-full">
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                      {user.tasks
                        .filter(task => task.status === selectedStatus) // Filtra as tarefas atribuídas pelo status
                        .map(task => (
                          <div key={`task-${task.id}-${user.id}`} className="px-2 pb-2 rounded bg-gray-400 shadow-md">
                            <div className="font-semibold text-white text-center bg-altBlue mb-2 rounded-b-lg shadow">
                              {user.user}
                            </div>
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
                {filteredTasks.map(task => (
                  <div key={task.id} className="">
                    <Task task={task} onStatusChange={handleStatusChange} />
                    <div className='bg-white rounded-b-xl flex justify-between px-4 pb-2'>
                      <div className='bg-primaryBlueDark w-full rounded-b-xl pb-2 flex justify-between px-2'>
                        <button
                          onClick={() => handleAssignTask(task)}
                          className={`text-white p-2 rounded mt-2 ${task.status === 'concluido' || task.requestSender || task.status === 'cancelado' || task.requesterName ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500'}`}
                          disabled={task.status === 'concluido' || task.requestSender || task.status === 'cancelado' || task.requesterName}
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

        {/* Select para Marcador */}
        <div className="mb-4">
          <label className="text-lg font-medium leading-6 text-gray-900">Marcador</label>
          <Select
            options={formattedMarkers}
            value={formattedMarkers.find(marker => marker.value === selectedMarker)}
            onChange={(selectedOption) => setSelectedMarker(selectedOption.value)}
            styles={customStyles}
            placeholder="Selecione um marcador"
          />
        </div>

        {/* Input e Botão para Adicionar Novo Marcador */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Adicionar novo marcador"
            value={newMarker}
            onChange={(e) => setNewMarker(e.target.value)}
            className="w-full p-2 border rounded"
          />
          {/* Input de Cor */}
          <input
            type="color"
            value={newMarkerColor}
            onChange={(e) => setNewMarkerColor(e.target.value)}
            className="w-10 h-10 p-1 rounded"
          />
          <button onClick={addMarker} className="p-2 bg-blue-500 text-white rounded">
            <BsPlus className="text-xl" />
          </button>
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
