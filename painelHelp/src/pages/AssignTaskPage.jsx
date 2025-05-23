import React, { useState, useEffect, useContext } from 'react';
import { collection, doc, setDoc, getDocs, updateDoc, onSnapshot, getDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import Select from 'react-select'; // Importa o react-select
import { AuthContext } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import MyModal from '../components/MyModal/MyModal';
import Task from '../components/Task/Task';
import { BsFillSendPlusFill } from "react-icons/bs";
import { MdDeleteForever, MdCancel, MdOutlineUpdate } from "react-icons/md";
import NotificationModal from '../components/NotificationModal/NotificationModal';
import { FaCheck } from "react-icons/fa";
import ReactQuill from 'react-quill'; // Importando React Quill
import 'react-quill/dist/quill.snow.css'; // Importando os estilos do Quill
import AlertModal from '../components/AlertModal/AlertModal';
import { BsPlus } from "react-icons/bs";
import { MdOutlineAddTask, MdToggleOff, MdToggleOn } from "react-icons/md";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importar Firebase Storage
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { IoIosHelpCircle } from "react-icons/io";
import { LuCalendarClock, LuCalendarCheck2 } from "react-icons/lu";
import { getApiUrls } from '../utils/apiBaseUrl';

// Configuração da toolbar do ReactQuill
const modules = {
  toolbar: [
    [{ 'font': [] }], // Fontes
    [{ 'size': [] }], // Tamanho da fonte
    [{ 'color': [] }], // Cores da fonte
    ['bold', 'italic'], // Negrito e Itálico
    [{ 'background': [] }], // Cor de fundo
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
  const [allUsers, setAllUsers] = useState([]);
  const [usersWithTasks, setUsersWithTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState('all');
  const [showAssignedTasks, setShowAssignedTasks] = useState(false);
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
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false); // Controla se a tarefa será atribuída
  const [selectAllManagers, setSelectAllManagers] = useState(false);
  const [isManagersModalOpen, setIsManagersModalOpen] = useState(false);
  const [taskFiles, setTaskFiles] = useState([]); // Lista de arquivos anexados
  const [cancelStatus, setCancelStatus] = useState('');
  const [conclusionFiles, setConclusionFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newDueDateModalOpen, setNewDueDateModalOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueDateReason, setNewDueDateReason] = useState('');
  const [selectedTaskForDueDate, setSelectedTaskForDueDate] = useState(null);
  const [isSavingNewDueDate, setIsSavingNewDueDate] = useState(false);
  const [filterByDueDate, setFilterByDueDate] = useState(true);
  const [dueDateError, setDueDateError] = useState(false);
  const maxFileSize = 85 * 1024 * 1024; // 85MB
  const maxFiles = 8;
  const [searchText, setSearchText] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [filterInstructionsModalOpen, setFilterInstructionsModalOpen] = useState(false);

  const removeAtrasoDeTodasTarefas = async () => {
    const tarefasRef = doc(db, "tarefas", "dateTarefas");

    try {
      const snapshot = await getDoc(tarefasRef);
      if (!snapshot.exists()) {
        console.warn("📭 Nenhuma tarefa encontrada.");
        return;
      }

      const tarefas = snapshot.data();
      const atualizacoes = {};

      Object.keys(tarefas).forEach((id) => {
        if (tarefas[id].hasOwnProperty("atraso")) {
          atualizacoes[`${id}.atraso`] = deleteField();
        }
      });

      if (Object.keys(atualizacoes).length === 0) {
        console.log("✅ Nenhuma tarefa com campo 'atraso' para remover.");
        return;
      }

      await updateDoc(tarefasRef, atualizacoes);
      console.log("✅ Campo 'atraso' removido de todas as tarefas com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao remover campo 'atraso':", error);
    }
  };


  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Se a string contém um "T", assumimos que está no formato ISO 8601
    if (dateStr.includes("T")) {
      return new Date(dateStr); // O JavaScript já interpreta automaticamente esse formato
    }

    // Se estiver no formato "DD/MM/YYYY", fazemos a conversão manualmente
    const parts = dateStr.split("/");
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  const convertToDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/'); // Espera "DD/MM/YYYY"
    return new Date(`${year}-${month}-${day}`); // Converte para "YYYY-MM-DD"
  };

  const filteredTasks = tasks
    .filter(task => {
      if (showAssignedTasks) {
        // Quando o toggle está ativado, mostra apenas tarefas onde o requester é o usuário logado e requesterName está ausente
        return task.requester === currentUser.user && !task.requesterName;
      }
      // Quando o toggle está desativado, mantém o filtro original
      return task.requesterName === currentUser.user || task.requester === currentUser.user;
    })
    .filter(task => selectedStatus === 'all' || task.status === selectedStatus)
    .filter(task => {
      if (!startDateFilter && !endDateFilter) return true;

      const taskDateStr = filterByDueDate ? task.dueDate : task.conclusionDate;
      const taskDate = parseDate(taskDateStr);

      if (!taskDate || isNaN(taskDate)) return false;

      const startDate = startDateFilter ? convertToDate(startDateFilter) : null;
      const endDate = endDateFilter ? convertToDate(endDateFilter) : null;

      return (!startDate || taskDate >= startDate) && (!endDate || taskDate <= endDate);
    })
    .filter(task => {
      if (!searchText.trim()) return true;
      const lowerCaseSearch = searchText.toLowerCase();

      // Filtros específicos
      if (lowerCaseSearch.startsWith("user:")) {
        const searchValue = lowerCaseSearch.replace("user:", "").trim();
        return task.requesterName && task.requesterName.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("loja:")) {
        const searchValue = lowerCaseSearch.replace("loja:", "").trim();
        return task.requesterLoja && task.requesterLoja.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("task:")) {
        const searchValue = lowerCaseSearch.replace("task:", "").trim();
        return task.task && task.task.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("prioridade:")) {
        const searchValue = lowerCaseSearch.replace("prioridade:", "").trim();
        return task.priority && task.priority.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("descrição:")) {
        const searchValue = lowerCaseSearch.replace("descrição:", "").trim();
        return task.description && task.description.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("conclusão:")) {
        const searchValue = lowerCaseSearch.replace("conclusão:", "").trim();
        return task.difficulties && task.difficulties.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("id:")) {
        const searchValue = lowerCaseSearch.replace("id:", "").trim();
        return task.id && task.id.toLowerCase().includes(searchValue);
      }

      if (lowerCaseSearch.startsWith("%%")) {
        const searchValue = lowerCaseSearch.replace("%%", "").trim();
        return Object.values(task).some(value =>
          typeof value === "string" && value.toLowerCase().includes(searchValue)
        );
      }

      if (lowerCaseSearch === "visualizadas") {
        return task.visto === true;
      }

      // Filtro padrão caso nenhuma opção especial tenha sido usada
      return (
        (task.task && task.task.toLowerCase().includes(lowerCaseSearch)) ||
        (task.description && task.description.toLowerCase().includes(lowerCaseSearch))
      );
    })
    .sort((a, b) => {
      const dateA = b.conclusionDate ? parseDate(b.conclusionDate) : parseDate(b.dueDate);
      const dateB = a.conclusionDate ? parseDate(a.conclusionDate) : parseDate(a.dueDate);

      return dateA - dateB;
    });

  useEffect(() => {
    setTasks([...tasks]); // Força a atualização quando o toggle é alterado
  }, [showAssignedTasks]);

  useEffect(() => {
    setTasks([...tasks]); // Força atualização ao mudar o filtro
  }, [filterByDueDate]);

  // Paginação
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  const [NOTIFICATION_API_URL, setNotificaApiUrl] = useState('');

  useEffect(() => {
    async function loadUrls() {
      try {
        const urls = await getApiUrls();
        setNotificaApiUrl(urls.VITE_NOTIFICATION_API_URL);
      } catch (error) {
        console.error("Erro ao carregar URL da API:", error);
      }
    }

    loadUrls();
  }, []);

  const sendNotification = async (tokens, notification) => {
    try {
      // Use a variável de ambiente NOTIFICATION_API_URL em vez da URL fixa
      const response = await fetch(NOTIFICATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokens,
          notification: {
            title: notification.title,
            body: notification.body,
            click_action: notification.click_action,
            icon: notification.icon
          }
        })
      });

      const responseData = await response.json(); // Converte a resposta em JSON

      if (response.ok) {
        //  console.log('Notificação enviada com sucesso.');
      } else {
        console.error('Falha ao enviar notificação. Status:', response.status);
        console.error('Resposta do servidor:', responseData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error); // Loga o erro, se ocorrer
    }
  };

  const handleRequestNewDueDate = (task) => {
    setSelectedTaskForDueDate(task);
    setNewDueDate('');
    setNewDueDateReason('');
    setNewDueDateModalOpen(true);
  };

  const handleSaveNewDueDate = async () => {
    if (!newDueDate || !newDueDateReason.trim()) {
      setAlertTitle('Erro ao Solicitar Novo Prazo');
      setAlertMessage('Por favor, preencha todos os campos obrigatórios.');
      setAlertOpen(true);
      return;
    }

    setIsSavingNewDueDate(true);

    try {
      const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

      await updateDoc(tarefasRef, {
        [`${selectedTaskForDueDate.id}.requestedDueDate`]: newDueDate,
        [`${selectedTaskForDueDate.id}.requestedDueDateReason`]: newDueDateReason,
        [`${selectedTaskForDueDate.id}.requestedDueDateStatus`]: 'pendente'
      });

      console.log(`✅ Novo prazo solicitado para a tarefa ${selectedTaskForDueDate.id}`);

      // 🔎 Buscar tokens do usuário responsável pela tarefa
      const usersRef = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersRef);

      let tokens = [];
      usersSnapshot.forEach((cityDoc) => {
        const cityData = cityDoc.data();
        if (cityData[selectedTaskForDueDate.requester] && Array.isArray(cityData[selectedTaskForDueDate.requester].token)) {
          tokens.push(...cityData[selectedTaskForDueDate.requester].token);
        }
      });

      // 🔥 Enviar notificação para o requester da tarefa
      if (tokens.length > 0) {
        const notification = {
          title: `${currentUser.user} - ${selectedTaskForDueDate.requesterLoja}`,
          body: `Solicitou um novo prazo para a tarefa: ${selectedTaskForDueDate.task}`,
          click_action: "https://drogalira.com.br/atribute",
          icon: "https://iili.io/duTTt8Q.png"
        };

        console.log("📨 Enviando notificação:", notification);
        await sendNotification(tokens, notification);
      } else {
        console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
      }

      setNewDueDateModalOpen(false);
      setSelectedTaskForDueDate(null);
    } catch (error) {
      console.error("Erro ao solicitar novo prazo:", error);
      setAlertTitle('Erro ao Solicitar Novo Prazo');
      setAlertMessage('Ocorreu um erro ao tentar solicitar o novo prazo.');
      setAlertOpen(true);
    } finally {
      setIsSavingNewDueDate(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + taskFiles.length > maxFiles) {
      setAlertTitle('Limite de Arquivos Excedido');
      setAlertMessage(`Você pode anexar no máximo ${maxFiles} arquivos.`);
      setAlertOpen(true);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        setAlertTitle('Arquivo Muito Grande');
        setAlertMessage(`O arquivo ${file.name} excede o limite de 85MB.`);
        setAlertOpen(true);
        return false;
      }
      return true;
    });

    setTaskFiles(prev => [...prev, ...validFiles]);
  };

  const uploadTaskFiles = async (taskId) => {
    const storage = getStorage();
    const fileUploadPromises = taskFiles.map(async (file) => {
      const fileRef = ref(storage, `tasks/${currentUser.user}/${taskId}/${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(fileUploadPromises);
  };

  const fetchUsersWithLoggedUserTasks = async () => {
    setIsLoadingUsers(true);
    try {
      const tasksCollection = collection(db, 'tarefas');
      const tasksSnapshot = await getDocs(tasksCollection);

      const usersWithTasks = [];

      for (const userDoc of tasksSnapshot.docs) {
        const userId = userDoc.id;
        const userTasksCollection = collection(db, 'tarefas', userId, 'tasks');
        const userTasksSnapshot = await getDocs(userTasksCollection);
        const userTasks = userTasksSnapshot.docs.map(doc => doc.data());

        const hasTaskFromLoggedUser = userTasks.some(task => task.requester === currentUser.user && task.requesterName);

        if (hasTaskFromLoggedUser) {
          usersWithTasks.push({ value: userId, label: userId });
        }
      }

      // Adiciona a opção "Todos" apenas se ainda não existir na lista
      const uniqueUsers = [{ value: "all", label: "Todos" }, ...usersWithTasks.filter((user, index, self) =>
        index === self.findIndex((u) => u.value === user.value)
      )];

      setFormattedUsers(uniqueUsers);


      setFormattedUsers(usersWithTasks);
    } catch (error) {
      console.error("Erro ao buscar usuários com tarefas do usuário logado:", error);
    } finally {
      setIsLoadingUsers(false);
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

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    console.log("🟢 Tarefas carregadas na interface:", tasks);
  }, [tasks]);

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
        //console.log("Documento de marcadores não encontrado.");
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
    { value: 'all', label: 'Todos' },
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
          //console.log("Erro: Marcador com esse label já existe.");
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

  useEffect(() => {
    const unsubscribeTasks = fetchTasks();
    const unsubscribeAssignments = fetchAssignments();

    return () => {
      if (typeof unsubscribeTasks === 'function') unsubscribeTasks();
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
    };
  }, [currentUser.user]);

  const fetchTasks = () => {
    try {
      return onSnapshot(doc(db, 'tarefas', 'dateTarefas'), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const tarefasData = docSnapshot.data();
          const tarefasLista = Object.keys(tarefasData).map(taskId => ({
            id: taskId,
            ...tarefasData[taskId]
          }));

          console.log("📋 Tarefas carregadas:", tarefasLista);

          // REMOVA QUALQUER FILTRAGEM AQUI para garantir que todas as tarefas sejam carregadas
          setTasks(tarefasLista);
        } else {
          console.warn("⚠️ Nenhuma tarefa encontrada.");
          setTasks([]);
        }
      });
    } catch (error) {
      console.error("❌ Erro ao buscar tarefas: ", error);
    }
  };

  const handleDeleteTask = (taskId) => {
    setDeleteTaskId(taskId);  // Armazena o ID da tarefa
    setConfirmDeleteOpen(true);  // Abre o modal de confirmação
  };

  const confirmDelete = async () => {
    if (deleteTaskId) {
      try {
        const tarefasRef = doc(db, 'tarefas', 'dateTarefas');
        await updateDoc(tarefasRef, {
          [deleteTaskId]: deleteField() // ✅ Remove apenas a tarefa específica
        });
        console.log(`✅ Tarefa ${deleteTaskId} excluída com sucesso.`);
      } catch (error) {
        setAlertTitle('Erro ao Excluir Tarefa');
        setAlertMessage('Ocorreu um erro ao tentar excluir a tarefa.');
        setAlertOpen(true);
      } finally {
        setDeleteTaskId(null);
        setConfirmDeleteOpen(false);
      }
    }
  };

  const fetchAssignments = () => {
    try {
      const citiesCollection = collection(db, 'usuarios');

      return onSnapshot(citiesCollection, async (snapshot) => {
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

        // Filtrando usuários com tarefas atribuídas
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
    } catch (error) {
      console.error("Error fetching assignments: ", error);
    }
  };

  // Function to generate a unique task number
  const generateTaskNumber = async () => {
    const orderRef = doc(db, 'ordersControl', 'orderTarefas');
    const orderSnap = await getDoc(orderRef);
    let orderNumber = orderSnap.data().orderNumber;

    if (!orderNumber || orderNumber.length !== 5) {
      console.error('Invalid order number format:', orderNumber);
      return 'TA001'; // Default to TA001 if format is invalid
    }

    // Extract the letter and numeric parts
    const letterPart = orderNumber.charAt(1);
    let numericPart = parseInt(orderNumber.slice(2));
    if (isNaN(numericPart)) {
      console.error('Invalid numeric part:', orderNumber.slice(2));
      numericPart = 0;
    }
    numericPart++;

    // Reset to '001' and increment the letter if numeric part exceeds 999
    if (numericPart > 999) {
      numericPart = 1;
      if (letterPart < 'Z') { // 'Z' is the last letter
        orderNumber = `T${String.fromCharCode(letterPart.charCodeAt(0) + 1)}001`;
      } else {
        console.error('Exceeded maximum task number limit');
        return 'TA001'; // Reset to TA001 if exceeded
      }
    } else {
      orderNumber = `T${letterPart}${String(numericPart).padStart(3, '0')}`;
    }

    // Update the order number in Firestore
    await updateDoc(orderRef, { orderNumber });

    return orderNumber;
  };

  const handleCreateTask = async () => {
    console.log("🔵 Iniciando criação da tarefa...");

    if (!newTaskTitle || !newTaskDescription || !newTaskDueDate || !priority) {
      console.error("❌ Erro: Campos obrigatórios não preenchidos.");
      setAlertTitle('Erro ao Criar Tarefa');
      setAlertMessage('Por favor, preencha todos os campos obrigatórios.');
      setAlertOpen(true);
      return;
    }

    const formatDate = (date) => {
      const pad = (num) => num.toString().padStart(2, '0');

      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());

      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    const createdAt = formatDate(new Date());

    console.log("📅 Data de criação:", createdAt);

    const fileURLs = taskFiles.length > 0 ? await uploadTaskFiles(uuidv4()) : [];
    console.log("📂 Arquivos anexados:", fileURLs);

    let marker = null;
    let markerColor = null;

    if (selectedMarker) {
      const markerData = markers.find(m => m.value === selectedMarker || m.label === selectedMarker);
      if (markerData) {
        marker = markerData.label || markerData.value;
        markerColor = markerData.color;
      }
    }

    console.log("🏷️ Marcador selecionado:", marker, markerColor);

    const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

    // 🔥 Pegando o último número gerado e incrementando
    const lastTaskId = await generateTaskNumber();
    let taskCounter = parseInt(lastTaskId.slice(2)); // Pegando apenas a parte numérica

    console.log(`🔄 Última tarefa registrada: ${lastTaskId} (próxima será baseada nisso)`);

    if (isAssigning && assignedUsers.length > 0) {
      console.log("👥 Criando tarefas atribuídas para múltiplos usuários...");

      await Promise.all(
        assignedUsers.map(async (user, index) => {
          const taskId = `TA${String(taskCounter + index + 1).padStart(3, '0')}`; // Garantindo sequência única
          console.log(`📌 Criando tarefa ID ${taskId} para o usuário ${user.value}`);

          const taskData = {
            id: taskId,
            task: newTaskTitle,
            description: newTaskDescription,
            status: 'pendente',
            dueDate: newTaskDueDate,
            priority: priority,
            requester: currentUser.user,
            conclusionFiles: [],
            requesterName: user.value,
            requesterLoja: user.loja || "Não Definida",
            createdAt,
            attachments: fileURLs,
            orientation: orientation,
            ...(marker && markerColor ? { marker, markerColor } : {}),
          };

          console.log("📝 Dados da tarefa sendo salvos:", taskData);

          try {
            await setDoc(tarefasRef, { [taskId]: taskData }, { merge: true });
            console.log(`✅ Tarefa ${taskId} salva com sucesso em dateTarefas.`);
          } catch (error) {
            console.error(`❌ Erro ao salvar tarefa ${taskId} em dateTarefas:`, error);
          }
          // Enviar notificação para os usuários atribuídos
          // Enviar notificação para os usuários atribuídos
          if (isAssigning && assignedUsers.length > 0) {
            try {
              console.log("🔎 Buscando tokens para usuários atribuídos:", assignedUsers);

              const usersRef = collection(db, 'usuarios');
              const usersSnapshot = await getDocs(usersRef);

              let tokens = [];

              usersSnapshot.forEach((cityDoc) => {
                const cityData = cityDoc.data();
                assignedUsers.forEach((user) => {
                  if (cityData[user.value] && Array.isArray(cityData[user.value].token)) {
                    tokens.push(...cityData[user.value].token); // Adiciona todos os tokens do array
                  }
                });
              });

              console.log("📌 Tokens Capturados:", tokens);

              if (tokens.length > 0) {
                const notification = {
                  title: "Nova Tarefa Atribuída",
                  body: `Você tem uma nova tarefa: ${newTaskTitle}`,
                  click_action: "https://drogalira.com.br/atribute",
                  icon: "https://iili.io/duTTt8Q.png"
                };

                console.log("📨 Enviando notificação com os seguintes dados:", notification);

                const response = await sendNotification(tokens, notification);
                console.log("✅ Resposta do Servidor:", response);
              } else {
                console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
              }
            } catch (error) {
              console.error("❌ Erro ao enviar notificação:", error);
            }
          }
        })
      );
    } else {
      console.log("📌 Criando uma única tarefa (não atribuída a usuários específicos)...");

      const taskId = `TA${String(taskCounter + 1).padStart(3, '0')}`; // Garantindo sequência única
      console.log(`📌 Criando tarefa ID ${taskId}`);

      const taskData = {
        id: taskId,
        task: newTaskTitle,
        description: newTaskDescription,
        status: 'pendente',
        dueDate: newTaskDueDate,
        priority: priority,
        requester: currentUser.user,
        conclusionFiles: [],
        createdAt,
        attachments: fileURLs,
        ...(marker && markerColor ? { marker, markerColor } : {}),
      };

      console.log("📝 Dados da tarefa sendo salvos:", taskData);

      try {
        await setDoc(tarefasRef, { [taskId]: taskData }, { merge: true });
        console.log(`✅ Tarefa ${taskId} salva com sucesso em dateTarefas.`);
      } catch (error) {
        console.error(`❌ Erro ao salvar tarefa ${taskId} em dateTarefas:`, error);
      }
    }

    console.log("🎉 Conclusão: Tarefas criadas com sucesso!");

    setModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setPriority('');
    setSelectedMarker('');
    setAssignedUsers([]);
    setTaskFiles([]);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

    try {
      await updateDoc(tarefasRef, {
        [`${taskId}.status`]: newStatus
      });
      console.log(`✅ Status da tarefa ${taskId} atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status da tarefa:", error);
    }
  };

  const handleAssignTask = (task) => {
    setSelectedTask(task);
    setSelectedUser(''); // Reseta usuário selecionado
    setOrientation(''); // Reseta o campo de orientação
    setChangeDueDate(false); // Reseta opção de alterar prazo
    setNewTaskDueDate(''); // Reseta a data de vencimento
    setShowAllUsers(false); // Reseta o checkbox de mostrar todos os usuários
    setAtributeModalOpen(true);
  };

  // Função para fechar o modal e limpar os estados
  const closeAtributeModal = () => {
    setAtributeModalOpen(false);
    setSelectedUser('');
    setOrientation('');
    setChangeDueDate(false);
    setNewTaskDueDate('');
    setShowAllUsers(false);
    setSelectAllManagers(false);
    setAssignedUsers([]);
  };

  const handleSaveAssignment = async () => {
    if (assignedUsers.length === 0 || !orientation) {
      setAlertTitle('Erro ao Atribuir Tarefa');
      setAlertMessage('Por favor, selecione pelo menos um usuário e preencha a orientação antes de atribuir a tarefa.');
      setAlertOpen(true);
      return;
    }

    if (selectedTask) {
      console.log("🟢 Iniciando atribuição da tarefa:", selectedTask.task);

      const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

      await updateDoc(tarefasRef, {
        [`${selectedTask.id}.requesterName`]: assignedUsers.map(user => user.value).join(', '),
        [`${selectedTask.id}.requesterLoja`]: assignedUsers.map(user => user.loja || "Não Definida").join(', '),
        [`${selectedTask.id}.orientation`]: orientation,
        [`${selectedTask.id}.dueDate`]: changeDueDate && newTaskDueDate ? newTaskDueDate : selectedTask.dueDate,
      });

      setAtributeModalOpen(false);
    }
  };

  const handleConcludeTask = (task) => {
    setSelectedTask(task);
    setConcludeModalOpen(true);
  };

  const handleCompleteTask = async () => {
    if (!difficulties || difficulties.trim() === '') {
      setAlertTitle('Erro');
      setAlertMessage('O campo "Dificuldades Enfrentadas" é obrigatório.');
      setAlertOpen(true);
      return;
    }

    if (!selectedTask) {
      return;
    }

    const conclusionDate = new Date().toISOString();
    const taskRef = doc(db, 'tarefas', 'dateTarefas');

    try {
      let fileURLs = [];
      if (conclusionFiles.length > 0) {
        fileURLs = await uploadConclusionFiles(selectedTask.id);
      }

      const taskSnapshot = await getDoc(taskRef);
      const taskData = taskSnapshot.exists() ? taskSnapshot.data()[selectedTask.id] : null;

      let updateData = {
        [`${selectedTask.id}.status`]: 'concluido',
        [`${selectedTask.id}.conclusionDate`]: conclusionDate,
      };

      if (taskData) {
        const existingFiles = taskData.conclusionFiles || [];
        updateData[`${selectedTask.id}.conclusionFiles`] = [...existingFiles, ...fileURLs];

        if (taskData.difficulties) {
          const existingNotDifficulties = taskData.notDifficulties || [];
          updateData[`${selectedTask.id}.notDifficulties`] = [...existingNotDifficulties, difficulties];
        } else {
          updateData[`${selectedTask.id}.difficulties`] = difficulties;
        }
      } else {
        updateData[`${selectedTask.id}.difficulties`] = difficulties;
        updateData[`${selectedTask.id}.conclusionFiles`] = fileURLs;
      }

      await updateDoc(taskRef, updateData);

      // Busca o nome do usuário e a loja para a notificação
      const userName = selectedTask.requesterName || "Usuário";
      const userLoja = selectedTask.requesterLoja || "Loja Desconhecida";
      const taskTitle = selectedTask.task || "Tarefa";

      const notificationTitle = `${userName} - ${userLoja}`;
      const notificationBody = `Concluiu a tarefa ${taskTitle}`;

      // Busca os tokens do Firebase para enviar a notificação
      const usersRef = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersRef);

      let tokens = [];
      usersSnapshot.forEach((cityDoc) => {
        const cityData = cityDoc.data();
        if (cityData[selectedTask.requester] && Array.isArray(cityData[selectedTask.requester].token)) {
          tokens.push(...cityData[selectedTask.requester].token);
        }
      });

      if (tokens.length > 0) {
        const notification = {
          title: notificationTitle,
          body: notificationBody,
          click_action: "https://drogalira.com.br/atribute",
          icon: "https://iili.io/duTTt8Q.png"
        };

        await sendNotification(tokens, notification);
      } else {
        console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
      }

      setConcludeModalOpen(false);
      setSelectedTask(null);
      setConclusionFiles([]);
      setDifficulties('');

    } catch (error) {
      console.error("Erro ao concluir a tarefa:", error);
    }
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

    if (!selectedTaskForCancel) {
      console.error("Erro: Nenhuma tarefa selecionada para cancelamento.");
      return;
    }

    const canceledDate = new Date().toISOString();
    const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

    try {
      await updateDoc(tarefasRef, {
        [`${selectedTaskForCancel.id}.status`]: 'cancelado',
        [`${selectedTaskForCancel.id}.descriptionCanceled`]: descriptionCanceled,
        [`${selectedTaskForCancel.id}.canceledDate`]: canceledDate
      });

      // 🔎 Buscar tokens do usuário responsável pela tarefa
      const usersRef = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersRef);

      let tokens = [];
      usersSnapshot.forEach((cityDoc) => {
        const cityData = cityDoc.data();
        if (cityData[selectedTaskForCancel.requester] && Array.isArray(cityData[selectedTaskForCancel.requester].token)) {
          tokens.push(...cityData[selectedTaskForCancel.requester].token);
        }
      });

      // 🔥 Enviar notificação para o usuário responsável
      if (tokens.length > 0) {
        const notification = {
          title: "Tarefa Cancelada",
          body: `A tarefa ${selectedTaskForCancel.task} foi cancelada.\nMotivo: ${descriptionCanceled}`,
          click_action: "https://drogalira.com.br/atribute",
          icon: "https://iili.io/duTTt8Q.png"
        };

        console.log("📨 Enviando notificação de cancelamento:", notification);
        await sendNotification(tokens, notification);
      } else {
        console.warn("⚠️ Nenhum token encontrado para envio da notificação de cancelamento.");
      }

      setCancelStatus('canceled');
      setTimeout(() => {
        setCancelModalOpen(false);
        setCancelStatus('');
        setDescriptionCanceled('');
        setSelectedTaskForCancel(null);
      }, 4000);
    } catch (error) {
      console.error("Erro ao cancelar a tarefa:", error);
    }
  };


  const handleConclusionFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + conclusionFiles.length > maxFiles) {
      setAlertTitle('Limite de Arquivos Excedido');
      setAlertMessage(`Você pode anexar no máximo ${maxFiles} arquivos.`);
      setAlertOpen(true);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        setAlertTitle('Arquivo Muito Grande');
        setAlertMessage(`O arquivo ${file.name} excede o limite de 85MB.`);
        setAlertOpen(true);
        return false;
      }
      return true;
    });

    setConclusionFiles(prev => [...prev, ...validFiles]);
  };

  const uploadConclusionFiles = async (taskId) => {
    const storage = getStorage();
    const fileUploadPromises = conclusionFiles.map(async (file) => {
      const fileRef = ref(storage, `conclusoes/${currentUser.user}/${taskId}/${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(fileUploadPromises);
  };

  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex bg-altBlue w-full">
      <div className="flex mt-10 w-full h-full">
        <div className='p-4 mt-4 w-full'>
          <button onClick={removeAtrasoDeTodasTarefas} className="bg-red-600 text-white p-2 rounded hidden">
            Remover campo atraso
          </button>

          <div className='flex flex-col gap-2 justify-center items-center p-4 rounded-md shadow bg-primaryBlueDark'>
            <div className='flex flex-col'>
              <div className='flex flex-col lg:flex-row gap-2 justify-between items-center py-2'>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setModalOpen(true);
                  }}
                  className="bg-green-800 shadow text-white p-2 rounded lg:w-11 w-full justify-center"
                >
                  <MdOutlineAddTask className='text-2xl text-center' />
                </button>
                <div className="hidden w-full lg:w-56">
                  <Select
                    options={formattedMarkers}
                    value={formattedMarkers.find(marker => marker.value === selectedFilterMarker)}
                    onChange={(selectedOption) => setSelectedFilterMarker(selectedOption ? selectedOption.value : null)}
                    styles={customStyles}
                    isClearable
                    placeholder="Marcador para filtrar"
                  />
                </div>
                <Select
                  options={statusOptions}
                  value={statusOptions.find(option => option.value === selectedStatus)}
                  onChange={(selectedOption) => setSelectedStatus(selectedOption.value)}
                  placeholder="Status da Tarefa"
                  className="w-full lg:w-56"
                  isClearable={false}  // Remove a opção de limpar para sempre ter um status
                />
                <div className='flex justify-center items-center bg-altBlue rounded-md'>
                  <p className='text-white bg-altBlue text-center px-2 '>
                    Minhas
                  </p>
                  <button onClick={() => {
                    setShowAssignedTasks(prev => {
                      console.log("Toggle antes:", prev);
                      const newState = !prev;
                      console.log("Toggle depois:", newState);
                      return newState;
                    });
                  }}>
                    {showAssignedTasks ? <MdToggleOn className="text-green-600 text-5xl" /> : <MdToggleOff className="text-red-600 text-5xl" />}
                  </button>
                </div>

              </div>
              <div className="flex flex-col lg:flex-row items-center lg:gap-4">
                <input
                  type="date"
                  value={startDateFilter ? startDateFilter.split('/').reverse().join('-') : ''}
                  onChange={(e) => setStartDateFilter(e.target.value.split('-').reverse().join('/'))}
                  className="p-2 border rounded"
                  placeholder="Data Inicial"
                />
                <span className='text-white'>até</span>
                <input
                  type="date"
                  value={endDateFilter ? endDateFilter.split('/').reverse().join('-') : ''}
                  onChange={(e) => {
                    const formattedDate = e.target.value.split('-').reverse().join('/');
                    setEndDateFilter(formattedDate);
                  }}
                  className="p-2 border rounded"
                  placeholder="Data Final"
                />
                <button
                  onClick={() => setFilterByDueDate(prev => !prev)}
                  className={`p-2 mt-2 lg:mt-[0px] rounded ${filterByDueDate ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                >
                  {filterByDueDate ? <LuCalendarClock size={25} /> : <LuCalendarCheck2 size={25} />}
                </button>
              </div>
              <div className='flex gap-2 mt-2'>
                <input
                  type="text"
                  placeholder="Buscar tarefa..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  className="bg-yellow-500 text-white p-2 rounded shadow-md"
                  onClick={() => setFilterInstructionsModalOpen(true)}
                >
                  <IoIosHelpCircle size={25} />
                </button>
              </div>
            </div>
          </div>
          <>
            {currentTasks.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentTasks.map(task => (
                  <div key={task.id} className="">
                    <Task task={task} onStatusChange={handleStatusChange} markers={markers} />
                    <div className="bg-white rounded-b-xl flex justify-between px-4 pb-2">
                      <div className='w-full'>
                        <div className="bg-primaryBlueDark w-full rounded-b-xl pb-2 flex justify-between px-2">

                          {task.requesterName !== currentUser.user && (
                            <button
                              onClick={() => handleAssignTask(task)}
                              className={`text-white p-2 rounded mt-2 
                      ${task.status === 'concluido' || task.requestSender || task.status === 'cancelado' || task.requesterName
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-500'}`}
                              disabled={task.status === 'concluido' || task.requestSender || task.status === 'cancelado' || task.requesterName}
                            >
                              <BsFillSendPlusFill className="text-xl" />
                            </button>
                          )}

                          {task.requesterName === currentUser.user && (
                            <button
                              onClick={() => handleRequestNewDueDate(task)}
                              className={`text-white p-2 rounded mt-2 ml-2 
      ${task.requestedDueDate || task.status !== 'pendente'
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-yellow-500'}`}
                              disabled={!!task.requestedDueDate || task.status !== 'pendente'}
                            >
                              <MdOutlineUpdate className="text-xl" />
                            </button>
                          )}

                          <button
                            onClick={() => handleConcludeTask(task)}
                            className={`text-white p-2 rounded mt-2 ml-2 
    ${task.status === 'concluido' ||
                                task.status === 'cancelado' ||
                                (task.requesterName && task.requesterName !== currentUser.user)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500'
                              }`}
                            disabled={
                              task.status === 'concluido' ||
                              task.status === 'cancelado' ||
                              (task.requesterName && task.requesterName !== currentUser.user)
                            }
                          >
                            <FaCheck className="text-xl" />
                          </button>

                          {/* Botão de Excluir */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className={`text-white p-2 rounded mt-2 ml-2 
    ${task.requester !== currentUser.user ||
                                task.status === 'concluido' ||
                                task.status === 'cancelado' ||
                                task.orientation ||
                                (task.requester === currentUser.user && task.requesterName && task.requesterName !== currentUser.user)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500'}`}
                            disabled={
                              task.requester !== currentUser.user ||
                              task.status === 'concluido' ||
                              task.status === 'cancelado' ||
                              task.orientation ||
                              (task.requester === currentUser.user && task.requesterName && task.requesterName !== currentUser.user)
                            }
                          >
                            <MdDeleteForever className="text-xl" />
                          </button>

                          {/* Botão de Cancelar */}
                          <button
                            onClick={() => handleOpenCancelModal(task)}
                            className={`text-white p-2 rounded mt-2 ml-2 
    ${task.status === 'concluido' ||
                                task.status === 'cancelado' ||
                                (task.requesterName && task.requesterName !== currentUser.user)
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-yellow-500'
                              }`}
                            disabled={
                              task.status === 'concluido' ||
                              task.status === 'cancelado' ||
                              (task.requesterName && task.requesterName !== currentUser.user)
                            }
                          >
                            <MdCancel className="text-xl" />
                          </button>
                        </div>
                        <p className='bg-altBlue p-1 rounded-t-xl text-center -mb-2 mt-1 text-white font-semibold w-20'>
                          {task.id}
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full text-center mt-4">
                <p className="text-gray-500">Nenhuma tarefa com esse status.</p>
              </div>
            )}
          </>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 mx-1 bg-white border rounded">
              Página {currentPage} de {Math.ceil(filteredTasks.length / tasksPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTasks.length / tasksPerPage)))}
              disabled={currentPage >= Math.ceil(filteredTasks.length / tasksPerPage)}
              className="px-4 py-2 mx-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>

      </div>

      <MyModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Criar Tarefa</h3>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Título da Tarefa"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              maxLength={36}
              className="w-full p-2 border rounded mb-2"
            />
            <ReactQuill
              value={newTaskDescription}
              onChange={setNewTaskDescription}
              modules={modules}
              className="mb-4 h-28"
            />

            {/* Select para Prioridade */}
            <div className='flex pt-14 lg:pt-8 gap-2 mb-3 justify-between'>
              <div className=" ">
                <label className="text-lg font-medium text-gray-900">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Prioridade</option>
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="text-lg font-medium leading-6 text-gray-900">Prazo</label>
                <input // AQUI O MINIMO DE DATA E HORA FUNCIONA
                  type="datetime-local"
                  value={newTaskDueDate ? new Date(newTaskDueDate).toLocaleString("sv-SE").replace(" ", "T") : ''}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)} // Impede datas passadas
                  className="w-full p-2 border rounded"
                />

              </div>
            </div>
            <p className='text-xs text-center bg-red-500 text-white p-1 rounded-lg'>
              A hora selecionada deve ser pelo menos 3 horas à frente do horário atual.
            </p>
          </div>

          {/* Checkbox para alternar entre atribuir e marcador */}

          <div className="mt-2 bg-slate-400 px-2 rounded-xl shadow-md text-center">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox w-5 h-5"
                checked={isAssigning}
                onChange={() => {
                  if (isAssigning) {
                    setAssignedUsers([]);
                    setSelectAllManagers(false);
                  }
                  setIsAssigning(!isAssigning);
                }}
              />
              <span className="ml-1 text-xl">Atribuir tarefa</span>
            </label>
          </div>


          {/* Seletor de Marcador (somente visível se não estiver atribuindo) */}
          <div
            className={`transition-all duration-300 ease-in-out ${isAssigning ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100 scale-100 h-auto'
              }`}
          >
            <div className="mb-4 hidden">
              <label className="text-lg font-medium leading-6 text-gray-900">Marcador</label>
              <Select
                options={formattedMarkers}
                value={formattedMarkers.find(marker => marker.value === selectedMarker)}
                onChange={(selectedOption) => setSelectedMarker(selectedOption.value)}
                styles={customStyles}
                placeholder="Selecione um marcador"
              />
              {/* Input e Botão para Adicionar Novo Marcador */}
              <div className="flex items-center gap-2 my-4">
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
            </div>
          </div>

          {/* Seção para atribuir tarefa (somente visível se o checkbox estiver marcado) */}
          <div
            className={`transition-all duration-300 ease-in-out ${isAssigning ? 'opacity-100 scale-100 h-auto' : 'opacity-0 scale-95 h-0 overflow-hidden'
              }`}
          >
            <div className="">
              <div className='flex flex-col'>
                <label className="text-lg font-medium leading-6 text-gray-900">Atribuir a</label>

                {/* Checkbox para mostrar todos os usuários */}
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={showAllUsers}
                    onChange={() => {
                      const newValue = !showAllUsers;
                      setShowAllUsers(newValue);
                      if (!newValue) {
                        setSelectAllManagers(false);
                        setAssignedUsers(
                          selectedOptions.map(user => ({
                            value: user.value,
                            label: user.label,
                            loja: allUsers.find(u => u.user === user.value)?.loja || "Desconhecido"
                          }))
                        );
                      }
                    }}
                  />
                  <span className="ml-1">Mostrar todos</span>
                </label>
              </div>
              {/* Checkbox para selecionar todos os gerentes */}
              <div className='flex flex-col'>
                {showAllUsers && (
                  <label className="inline-flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectAllManagers}
                      onChange={() => {
                        setSelectAllManagers(!selectAllManagers);
                        if (!selectAllManagers) {
                          // Seleciona todos os usuários com cargo "Gerente"
                          const managers = allUsers
                            .filter(user => user.cargo === "Gerente")
                            .map(user => ({ value: user.user, label: `${user.user} - ${user.cargo}` }));

                          setAssignedUsers(managers);
                        } else {
                          // Desseleciona os usuários
                          setAssignedUsers([]);
                        }
                      }}
                    />
                    <span className="ml-2">Selecionar todos os gerentes</span>
                  </label>
                )}

                {/* Selecione ou botão "Ver Gerentes" */}
                {selectAllManagers ? (
                  <button
                    className="mt-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    onClick={() => setIsManagersModalOpen(true)}
                  >
                    Ver Gerentes
                  </button>

                ) : (
                  <Select
                    isMulti
                    options={
                      allUsers.length > 0
                        ? showAllUsers
                          ? allUsers
                            .filter(user => user.user !== currentUser.user) // Exclui o próprio usuário logado
                            .map(user => ({
                              value: user.user,
                              label: `${user.user} - ${user.cargo} - ${user.loja}`
                            }))
                          : allUsers
                            .filter(user => user.cargo === currentUser.cargo && user.user !== currentUser.user) // Mostra apenas usuários com o mesmo cargo, excluindo o logado
                            .map(user => ({
                              value: user.user,
                              label: `${user.user} - ${user.cargo} - ${user.loja}`
                            }))
                        : []
                    }
                    value={assignedUsers}
                    onChange={(selectedOptions) => {
                      setAssignedUsers(
                        selectedOptions.map(user => ({
                          value: user.value,
                          label: user.label,
                          loja: allUsers.find(u => u.user === user.value)?.loja || "Desconhecido"
                        }))
                      );
                      setSelectAllManagers(false); // Desmarca a seleção de todos os gerentes se alterar manualmente
                    }}
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Selecione os usuários"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Anexar Arquivos (opcional)</h3>
            <input
              type="file"
              multiple
              accept=".pdf, .doc, .docx, .xls, .xlsx, .txt, .png, .jpg, .jpeg, .gif, .mp4"
              onChange={handleFileChange}
              className="w-full p-2 border rounded mb-2"
            />
            <p className="text-xs text-gray-600">Máximo de 8 arquivos, tamanho máximo 85MB por arquivo.</p>

            {taskFiles.length > 0 && (
              <ul className="mt-2 text-sm">
                {taskFiles.map((file, index) => (
                  <li key={index} className="text-gray-700 flex justify-between">
                    {file.name}
                    <button
                      className="text-red-500 ml-2"
                      onClick={() => setTaskFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              className={`bg-altBlue w-full text-white p-2 rounded ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isCreating}
              onClick={async () => {
                setIsCreating(true);
                await handleCreateTask();
                setIsCreating(false);
              }}
            >
              {isCreating ? <LoadingSpinner /> : "Salvar"}
            </button>
          </div>
        </>
      </MyModal>

      <MyModal isOpen={isManagersModalOpen} onClose={() => setIsManagersModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Gerentes Selecionados</h3>
        <ul className="mt-4">
          {assignedUsers.length > 0 ? (
            assignedUsers.map((user, index) => (
              <li key={index} className="p-2 border-b">{user.label}</li>
            ))
          ) : (
            <p className="text-gray-500">Nenhum gerente selecionado.</p>
          )}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => setIsManagersModalOpen(false)}
          >
            Fechar
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={atributeModalOpen} onClose={closeAtributeModal}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Atribuir Tarefa</h3>
        <div className="">
          <div className='flex flex-col'>
            {/* Checkbox para mostrar todos os usuários */}
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={showAllUsers}
                onChange={() => setShowAllUsers(!showAllUsers)}
              />
              <span className="ml-2">Mostrar todos</span>
            </label>
          </div>
          {/* Checkbox para selecionar todos os gerentes */}
          {showAllUsers && (
            <label className="inline-flex items-center mt-2">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={selectAllManagers}
                onChange={() => {
                  setSelectAllManagers(!selectAllManagers);
                  if (!selectAllManagers) {
                    // Seleciona todos os usuários com cargo "Gerente"
                    const managers = allUsers
                      .filter(user => user.cargo === "Gerente" && user.user !== currentUser.user) // Exclui o próprio usuário logado
                      .map(user => ({ value: user.user, label: `${user.user} - ${user.cargo}` }));

                    setAssignedUsers(managers);
                  } else {
                    setAssignedUsers([]);
                  }
                }}
              />
              <span className="ml-2">Selecionar todos os gerentes</span>
            </label>
          )}

          {/* Selecione ou botão "Ver Gerentes" */}
          {selectAllManagers ? (
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => setIsManagersModalOpen(true)}
            >
              Ver Gerentes
            </button>
          ) : (
            <Select
              isMulti
              options={
                allUsers.length > 0
                  ? showAllUsers
                    ? allUsers
                      .filter(user => user.user !== currentUser.user) // Exclui o próprio usuário logado
                      .map(user => ({
                        value: user.user,
                        label: `${user.user} - ${user.cargo} - ${user.loja}`
                      }))
                    : allUsers
                      .filter(user => user.cargo === currentUser.cargo && user.user !== currentUser.user) // Mostra apenas usuários com o mesmo cargo, excluindo o logado
                      .map(user => ({
                        value: user.user,
                        label: `${user.user} - ${user.cargo} - ${user.loja}`
                      }))
                  : []
              }
              value={assignedUsers}
              onChange={(selectedOptions) => {
                setAssignedUsers(
                  selectedOptions.map(user => ({
                    value: user.value,
                    label: user.label,
                    loja: allUsers.find(u => u.user === user.value)?.loja || "Desconhecido"
                  }))
                );
                setSelectAllManagers(false); // Desmarca a seleção de todos os gerentes se alterar manualmente
              }}
              className="w-full p-2 border rounded mb-2"
              placeholder="Selecione os usuários"
            />
          )}
        </div>

        {/* Checkbox para alterar o prazo */}
        <div className="mt-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={changeDueDate}
              onChange={() => {
                if (selectedTask && new Date(selectedTask.dueDate) - new Date() > (2 * 60 * 60 * 1000 + 59 * 60 * 1000)) {
                  setChangeDueDate(!changeDueDate);
                }
              }}
              disabled={!selectedTask || new Date(selectedTask.dueDate) - new Date() <= (2 * 60 * 60 * 1000 + 59 * 60 * 1000)}
            />
            <span className="ml-2">Alterar Prazo</span>
          </label>
        </div>

        {/* Mostrar input de data se o checkbox "Alterar Prazo" estiver selecionado */}
        {changeDueDate && (
          <div className="mt-1">
            <input // AQUI O MINIMO DE DATA E HORA NÃO FUNCIONA
              type="datetime-local"
              value={newTaskDueDate ? parseDateFromDDMMYYYY(newTaskDueDate) : ''}
              onChange={(e) => {
                setNewTaskDueDate(formatDateToDDMMYYYY(e.target.value));
                if (e.target.value) setDueDateError(false);
              }}
              className={`w-full p-2 border rounded mb-2 ${dueDateError ? 'border-red-500' : ''}`}
            />
            {dueDateError && (
              <p className="text-xs text-center bg-red-500 text-white p-1 rounded-lg mb-2">
                O prazo é obrigatório quando a opção "Alterar Prazo" está marcada.
              </p>
            )}

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
            className={`bg-altBlue w-full text-white p-2 rounded ${isSavingAssignment ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSavingAssignment}
            onClick={async () => {
              if (changeDueDate && !newTaskDueDate) {
                setDueDateError(true);
                return;
              }
              setIsSavingAssignment(true);
              await handleSaveAssignment();
              setIsSavingAssignment(false);
            }}
          >
            {isSavingAssignment ? <LoadingSpinner /> : "Salvar"}
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={concludeModalOpen} onClose={() => setConcludeModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Concluir Tarefa</h3>
          {/* Campo de ReactQuill para as dificuldades */}
          <div className="mt-4 mb-16">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Dificuldades/Conclusão<span className="text-red-500">*</span>
            </h3>
            <ReactQuill
              value={difficulties}
              onChange={setDifficulties}
              modules={modules}
              className="mb-4 h-32"
            />
          </div>
          {/* Seção para anexar arquivos */}
          <div className="">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Anexar Arquivos (opcional)</h3>
            <input
              type="file"
              multiple
              accept=".pdf, .doc, .docx, .xls, .xlsx, .txt, .png, .jpg, .jpeg, .gif, .mp4"
              onChange={handleConclusionFileChange}
              className="w-full p-2 border rounded mb-2"
            />
            <p className="text-xs text-gray-600">
              Máximo de 8 arquivos, tamanho máximo 85MB por arquivo.
            </p>
            {conclusionFiles.length > 0 && (
              <ul className="mt-2 text-sm">
                {conclusionFiles.map((file, index) => (
                  <li key={index} className="text-gray-700 flex justify-between">
                    {file.name}
                    <button
                      className="text-red-500 ml-2"
                      onClick={() =>
                        setConclusionFiles(prev => prev.filter((_, i) => i !== index))
                      }
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <button
              disabled={uploading}
              type="button"
              className={`bg-altBlue w-full text-white p-2 rounded ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={async () => {
                setUploading(true);
                await handleCompleteTask();
                setUploading(false);
              }}
            >
              {uploading ? <LoadingSpinner /> : "Salvar"}
            </button>
          </div>
        </>
      </MyModal>

      <MyModal isOpen={isCancelModalOpen} onClose={() => setCancelModalOpen(false)}>
        {cancelStatus === 'canceled' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h3 className="text-xl font-medium leading-6 text-gray-900">🚫 Sua Tarefa foi cancelada!</h3>
            <p className="mt-2 text-md text-gray-700">✅ O motivo foi gravado com sucesso.</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-medium leading-6 text-gray-900">Cancelar Tarefa</h3>
            <div className="mt-4">
              <ReactQuill
                value={descriptionCanceled}
                onChange={setDescriptionCanceled}
                modules={modules}
                className="mb-4 mt-5 h-32"
                placeholder="Descreva o motivo do cancelamento"
              />
            </div>
            <div className="mt-16 flex justify-end">
              <button
                disabled={isCanceling}
                className={`bg-red-500 text-white p-2 rounded ${isCanceling ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={async () => {
                  setIsCanceling(true);
                  await handleCancelTask();
                  setIsCanceling(false);
                }}
              >
                {isCanceling ? <LoadingSpinner /> : "Confirmar Cancelamento"}
              </button>
            </div>
          </>
        )}
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
            disabled={isDeleting}
            className={`bg-red-500 text-white p-2 rounded ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={async () => {
              setIsDeleting(true);
              await confirmDelete();
              setIsDeleting(false);
            }}
          >
            {isDeleting ? <LoadingSpinner /> : "Excluir"}
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={newDueDateModalOpen} onClose={() => setNewDueDateModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Novo Prazo</h3>

          <div className="mt-4">
            <label className="text-lg font-medium leading-6 text-gray-900">Novo Prazo</label>
            <input
              type="datetime-local"
              value={newDueDate ? newDueDate : ''}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)} // Impede datas passadas
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Motivo da Solicitação</h3>
            <ReactQuill
              value={newDueDateReason}
              onChange={setNewDueDateReason}
              modules={modules}
              className="mb-4 h-32"
            />
          </div>

          <div className="mt-16">
            <button
              type="button"
              className={`bg-altBlue w-full text-white p-2 rounded ${isSavingNewDueDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSavingNewDueDate}
              onClick={handleSaveNewDueDate}
            >
              {isSavingNewDueDate ? <LoadingSpinner /> : "Salvar"}
            </button>
          </div>
        </>
      </MyModal>

      <MyModal isOpen={filterInstructionsModalOpen} onClose={() => setFilterInstructionsModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Como usar os filtros de texto</h3>
        <div className="mt-4 space-y-2">
          <p className='border-b cursor-pointer' onClick={() => setSearchText("user:")}>
            <strong>Filtrar Usuario → </strong> <code>user:NomeDoUsuário</code>
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("loja:")}>
            <strong>Filtrar Loja → </strong> <code>loja:NomeDaLoja</code>
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("task:")}>
            <strong>Filtrar pelo Titulo → </strong> <code>task:NomeDaTarefa</code>
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("prioridade:")}>
            <strong>Filtrar por Prioridade → </strong> <code>prioridade:baixa</code>
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("descrição:")}>
            <strong>Filtrar por Descrição → </strong> <code>descrição:palavra</code> → Filtra palavras dentro da descrição.
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("conclusão:")}>
            <strong>Filtrar por Conclusão → </strong> <code>conclusão:palavra</code> → Filtra palavras dentro da conclusão.
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("id:")}>
            <strong>ID → </strong> <code>id:TA001</code> → Busca por ID da tarefa.
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("%%")}>
            <strong>Geral → </strong> <code>%%palavra</code> → Busca a palavra em qualquer lugar da tarefa.
          </p>
          <p className='border-b cursor-pointer' onClick={() => setSearchText("visualizadas")}>
            <strong>Visualizadas → </strong> <code>visualizadas</code> → Mostra apenas tarefas já visualizadas.
          </p>
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