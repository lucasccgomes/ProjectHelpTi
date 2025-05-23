import React, { useContext, useEffect, useState } from 'react';
import MyModal from '../MyModal/MyModal'; // Assumindo que o MyModal está no diretório components
import { MdDescription, MdOutlineUpdate } from "react-icons/md";
import { RiGuideFill } from "react-icons/ri";
import { SiLevelsdotfyi } from "react-icons/si";
import { FaCheckCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { MdPending } from "react-icons/md";
import { LuCalendarClock, LuCalendarCheck2, LuCalendarX } from "react-icons/lu";
import { FaUserTie } from "react-icons/fa";
import { BsPlus } from "react-icons/bs";
import { ImCancelCircle } from "react-icons/im";
import { doc, updateDoc, setDoc, getDoc, onSnapshot, getDocs, deleteField, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { IoBookmarkSharp } from "react-icons/io5";
import Select from 'react-select'; // Importa o react-select
import { db } from '../../firebase';
import { BiBookmarkPlus } from "react-icons/bi";
import { AuthContext } from '../../context/AuthContext';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import ReactQuill from 'react-quill';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { MdError } from "react-icons/md";
import { AiOutlineEye, AiFillEye } from "react-icons/ai";
import { RiMailSendLine } from "react-icons/ri";
import { getApiUrls } from '../../utils/apiBaseUrl';


const Task = ({ task, onStatusChange, markers = [] }) => {
  const [isDescriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [isOrientationModalOpen, setOrientationModalOpen] = useState(false); // Novo estado para o modal de orientação
  const [isDifficultiesModalOpen, setDifficultiesModalOpen] = useState(false); // Novo estado para o modal de dificuldades
  const [isCanceledDescriptionModalOpen, setCanceledDescriptionModalOpen] = useState(false); // Novo estado para o modal de descrição de cancelamento
  const [isMarkerModalOpen, setMarkerModalOpen] = useState(false);
  const [newMarker, setNewMarker] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#000000');
  const [selectedMarker, setSelectedMarker] = useState('');
  const { currentUser } = useContext(AuthContext);
  const [markerList, setMarkerList] = useState(markers);
  const [dueDateDetailsModalOpen, setDueDateDetailsModalOpen] = useState(false);
  const [selectedTaskForDueDateDetails, setSelectedTaskForDueDateDetails] = useState(null);
  const [editedDueDate, setEditedDueDate] = useState('');
  const [isNotModalOpen, setIsNotModalOpen] = useState(false);
  const [notDescription, setNotDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isNotViewModalOpen, setIsNotViewModalOpen] = useState(false);
  const [uploadingNotFiles, setUploadingNotFiles] = useState(false);
  const [isViewed, setIsViewed] = useState(task.visto || false);
  const [tarefas, setTarefas] = useState([]);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length + attachments.length > 8) {
      alert("Você só pode anexar até 8 arquivos.");
      return;
    }

    const validFiles = files.filter(file => file.size <= 85 * 1024 * 1024);

    if (validFiles.length !== files.length) {
      alert("Alguns arquivos foram ignorados porque ultrapassam o limite de 85MB.");
    }

    setAttachments([...attachments, ...validFiles]);
  };

  const handleSaveNot = async () => {
    if (!notDescription.trim() && attachments.length === 0) {
      alert("Adicione uma descrição ou um anexo.");
      return;
    }

    setUploadingNotFiles(true);

    try {
      const taskRef = doc(db, 'tarefas', 'dateTarefas');

      // 🔍 Verifica se a tarefa existe antes de tentar atualizar
      const taskSnapshot = await getDoc(taskRef);

      if (!taskSnapshot.exists()) {
        console.error("❌ Erro: A tarefa não existe no Firestore.");
        alert("Erro: A tarefa não foi encontrada no sistema.");
        setUploadingNotFiles(false);
        return;
      }

      let fileURLs = [];
      if (attachments.length > 0) {
        fileURLs = await uploadNotFiles(task.id);
      }

      const updateData = {
        [`${task.id}.status`]: 'pendente',
        [`${task.id}.notDescription`]: notDescription,
        [`${task.id}.notAttachments`]: fileURLs,
      };

      await updateDoc(taskRef, updateData);
      console.log(`✅ Correção da tarefa ${task.id} salva com sucesso.`);

      setIsNotModalOpen(false);
      setAttachments([]);

      // 🔔 Enviar notificação para o requesterName
      if (task.requesterName) {
        const usersSnapshot = await getDocs(collection(db, 'usuarios'));
        let userTokens = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          if (userData[task.requesterName]) {
            userTokens = userData[task.requesterName].token || [];
            break;
          }
        }

        if (userTokens.length > 0) {
          const notification = {
            title: "Erros na tarefa",
            body: `Erro na ${task.task}`,
            click_action: "https://drogalira.com.br/atribute",
            icon: "https://iili.io/duTTt8Q.png"
          };

          await sendNotification(userTokens, notification);
        } else {
          console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
        }
      }

    } catch (error) {
      console.error("❌ Erro ao salvar NOT:", error);
      alert("Erro ao salvar a correção. Tente novamente.");
    } finally {
      setUploadingNotFiles(false);
    }
  };

  const uploadNotFiles = async (taskId) => {
    const storage = getStorage();
    const fileUploadPromises = attachments.map(async (file) => {
      const fileRef = ref(storage, `notAttachments/${task.requesterName}/${taskId}/${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(fileUploadPromises);
  };

  const handleOpenDueDateDetails = (task) => {
    setSelectedTaskForDueDateDetails(task);

    // Verifica se existe uma data e formata corretamente para 'YYYY-MM-DDTHH:MM'
    const formattedDate = task.requestedDueDate
      ? new Date(task.requestedDueDate).toISOString().slice(0, 16) // Garante formato correto para datetime-local
      : '';

    setEditedDueDate(formattedDate);
    setDueDateDetailsModalOpen(true);
  };
  // Definindo a cor do quadrado com base na prioridade
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'baixa':
        return 'bg-blue-500';
      case 'média':
        return 'bg-yellow-500';
      case 'alta':
        return 'bg-red-500';
      default:
        return 'bg-gray-300'; // Cor padrão caso a prioridade não seja especificada
    }
  };

  const isDueToday = (dueDate) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);

    return (
      today.getDate() === dueDateObj.getDate() &&
      today.getMonth() === dueDateObj.getMonth() &&
      today.getFullYear() === dueDateObj.getFullYear()
    );
  };

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);

    // Adiciona um dia de tolerância à data de vencimento
    dueDateObj.setDate(dueDateObj.getDate() + 1);
    return today > dueDateObj;
  };

  useEffect(() => {
    console.log("🔍 Iniciando busca de tarefas...");
    const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

    const unsubscribe = onSnapshot(tarefasRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const tarefasData = docSnapshot.data();
        console.log("📥 Tarefas recebidas:", tarefasData);

        // Convertendo o objeto de tarefas em uma lista
        const tarefasLista = Object.keys(tarefasData).map(taskId => ({
          id: taskId,
          ...tarefasData[taskId]
        }));

        console.log("📋 Lista formatada de tarefas:", tarefasLista);
        setTarefas(tarefasLista);
      } else {
        console.log("❌ Nenhuma tarefa encontrada!");
        setTarefas([]);
      }
    }, (error) => {
      console.error("❌ Erro ao buscar tarefas:", error);
    });

    return () => unsubscribe();
  }, []);

  // Formatação das opções do select
  const formattedMarkers = markerList.map(marker => ({
    value: marker.label,
    label: marker.label,
    color: marker.color
  }));

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
    control: (provided) => ({
      ...provided,
      cursor: 'pointer',
    })
  };

  // Função para salvar o marcador na tarefa com logs detalhados
  const saveMarkerToTask = async () => {
    if (selectedMarker) {
      const selectedMarkerObject = markers.find(marker => marker.label === selectedMarker);

      try {
        const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

        await updateDoc(tarefasRef, {
          [`${task.id}.marker`]: selectedMarkerObject.label,
          [`${task.id}.markerColor`]: selectedMarkerObject.color
        });

        task.marker = selectedMarkerObject.label;
        task.markerColor = selectedMarkerObject.color;
        setMarkerModalOpen(false);
      } catch (error) {
        console.error("Erro ao salvar marcador na tarefa:", error);
      }
    } else {
      console.warn("Nenhum marcador foi selecionado para salvar.");
    }
  };

  // Função para adicionar um novo marcador com logs detalhados
  const addMarker = async () => {
    if (newMarker.trim() !== '' && newMarkerColor) {
      const markersDocRef = doc(db, 'ordersControl', 'marcadoresTarefas', currentUser.user, 'marker');

      try {
        const docSnap = await getDoc(markersDocRef);
        const newMarkerObject = { label: newMarker, color: newMarkerColor };

        if (docSnap.exists()) {
          const existingMarkers = docSnap.data().array || [];

          // Verificar se já existe um marcador com o mesmo label
          if (existingMarkers.some(marker => marker.label === newMarker)) {
            console.warn("Erro: Marcador com esse label já existe.");
            return;
          }

          const updatedMarkers = [...existingMarkers, newMarkerObject];

          await setDoc(markersDocRef, { array: updatedMarkers });

        } else {
          await setDoc(markersDocRef, { array: [newMarkerObject] });
        }

        // Como o `onSnapshot` já atualiza os marcadores em tempo real, não precisamos chamar `setMarkerList` aqui
        setSelectedMarker(newMarker);
        setNewMarker('');
        setNewMarkerColor('#000000');
      } catch (error) {
        console.error("Erro ao adicionar marcador:", error);
      }
    } else {
      console.warn("Nome ou cor do novo marcador inválidos.");
    }
  };

  const handleUpdateDueDateStatus = async (status) => {
    if (!selectedTaskForDueDateDetails) return;
  
    try {
      const taskRef = doc(db, 'tarefas', 'dateTarefas');
      const taskSnapshot = await getDoc(taskRef);
  
      if (!taskSnapshot.exists() || !taskSnapshot.data()[selectedTaskForDueDateDetails.id]) {
        console.error(`❌ Erro: O documento da tarefa ${selectedTaskForDueDateDetails.id} não existe.`);
        setAlertTitle('Erro ao Atualizar Prazo');
        setAlertMessage('A tarefa não foi encontrada. Pode ter sido removida.');
        setAlertOpen(true);
        return;
      }
  
      let newDueDateISO = selectedTaskForDueDateDetails.dueDate;
  
      if (status === 'aprovado') {
        const localDate = new Date(editedDueDate);
        const timezoneOffset = localDate.getTimezoneOffset() * 60000;
        newDueDateISO = new Date(localDate.getTime() - timezoneOffset).toISOString().slice(0, 19).replace('T', ' ');
      }
  
      const updateData = {
        [`${selectedTaskForDueDateDetails.id}.requestedDueDateStatus`]: status,
        ...(status === 'aprovado' && { [`${selectedTaskForDueDateDetails.id}.dueDate`]: newDueDateISO }),
        ...(selectedTaskForDueDateDetails.atraso && { [`${selectedTaskForDueDateDetails.id}.atraso`]: deleteField() })
      };
  
      await updateDoc(taskRef, updateData);
  
      setSelectedTaskForDueDateDetails((prevTask) => ({
        ...prevTask,
        requestedDueDateStatus: status,
        ...(status === 'aprovado' && { dueDate: newDueDateISO }),
        ...(selectedTaskForDueDateDetails.atraso && { atraso: undefined })
      }));
  
      console.log(`✅ Status do prazo da tarefa ${selectedTaskForDueDateDetails.id} atualizado para ${status}.`);
  
      // 🔔 Enviar notificação para o requesterName
      if (selectedTaskForDueDateDetails.requesterName) {
        const usersRef = collection(db, 'usuarios');
        const usersSnapshot = await getDocs(usersRef);
        let userTokens = [];
  
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          if (userData[selectedTaskForDueDateDetails.requesterName]) {
            userTokens = userData[selectedTaskForDueDateDetails.requesterName].token || [];
            break;
          }
        }
  
        if (userTokens.length > 0) {
          const notification = {
            title: `${selectedTaskForDueDateDetails.requesterName} - ${selectedTaskForDueDateDetails.requesterLoja}`,
            body: `O novo prazo da tarefa ${selectedTaskForDueDateDetails.task} foi ${status === 'aprovado' ? 'aprovado' : 'negado'}.`,
            click_action: "https://drogalira.com.br/atribute",
            icon: "https://iili.io/duTTt8Q.png"
          };
  
          await sendNotification(userTokens, notification);
        } else {
          console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
        }
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar status do prazo:", error);
      setAlertTitle('Erro ao Atualizar Prazo');
      setAlertMessage('Ocorreu um erro ao tentar atualizar o status da solicitação.');
      setAlertOpen(true);
    }
  };
  
  const handleDescriptionClick = async () => {
    setDescriptionModalOpen(true); // Abre o modal normalmente

    // Só atualiza o status se ainda não foi visto
    if (!isViewed) {
      try {
        const tarefasRef = doc(db, 'tarefas', 'dateTarefas');

        // Atualiza a tarefa para marcar como vista
        await updateDoc(tarefasRef, {
          [`${task.id}.visto`]: true
        });

        setIsViewed(true); // Atualiza o estado local para refletir a mudança

        // Só envia notificação se:
        // 1. A tarefa tiver um requesterName
        // 2. O usuário logado for o mesmo que o requesterName
        if (task.requesterName && currentUser.user === task.requesterName) {
          const usersRef = collection(db, 'usuarios');
          const usersSnapshot = await getDocs(usersRef);
          let tokens = [];

          usersSnapshot.forEach((cityDoc) => {
            const cityData = cityDoc.data();
            if (cityData[task.requester] && Array.isArray(cityData[task.requester].token)) {
              tokens.push(...cityData[task.requester].token);
            }
          });

          if (tokens.length > 0) {
            const notification = {
              title: `${currentUser.user} - ${task.requesterLoja}`,
              body: `Acabou de ver a descrição da tarefa: ${task.task}`,
              click_action: "https://drogalira.com.br/atribute",
              icon: "https://iili.io/duTTt8Q.png"
            };

            await sendNotification(tokens, notification);
          } else {
            console.warn("⚠️ Nenhum token encontrado para envio da notificação.");
          }
        }

      } catch (error) {
        console.error("Erro ao atualizar status de visto:", error);
      }
    }
  };

  useEffect(() => {
    const markersDocRef = doc(db, 'ordersControl', 'marcadoresTarefas', currentUser.user, 'marker');

    const unsubscribe = onSnapshot(markersDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const fetchedMarkers = docSnap.data().array || [];

        // Garantir que os marcadores sejam únicos antes de setar o estado
        const uniqueMarkers = fetchedMarkers.filter(
          (marker, index, self) => index === self.findIndex((m) => m.label === marker.label)
        );

        setMarkerList(uniqueMarkers);
      }
    });

    return () => unsubscribe();
  }, [currentUser.user]);

  return (
    <div className={`px-4 rounded-t-xl w-full ${isTaskOverdue(task.dueDate) ? 'bg-white' : 'bg-white'}`}>
      <div className='flex gap-2'>
        {(!task.requesterName || currentUser.user === task.requesterName) && (
          <div className='hidden'>
            {task.marker && task.markerColor ? (
              <div className='hidden'>
                <IoBookmarkSharp
                  className='text-3xl -mt-[0.1rem]'
                  style={{ color: task.markerColor }}
                  data-tooltip-id="marker-tooltip"
                  data-tooltip-content={task.marker}
                />
                <ReactTooltip id="marker-tooltip" place="top" type="dark" effect="solid" />
              </div>
            ) : (
              <button
                className=""
                onClick={() => setMarkerModalOpen(true)}
              >
                <BiBookmarkPlus className='-mt-[0.2rem] text-3xl text-primaryBlueDark' />
              </button>
            )}
          </div>
        )}

        <div className={`${task.atraso > 0 ? 'bg-red-600' : 'bg-primaryBlueDark'} min-h-[44px] w-full flex flex-col font-semibold rounded-b-xl pr-1 text-white shadow-md`}>
          <div className='flex justify-between'>
            <p className=' text-sm text-center w-full px-1'>
              {task.task}
            </p>
            {task.atraso > 0 && (
              <div className='flex gap-1'>
                <p className="text-white text-sm font-semibold">Atr:{task.atraso}d</p>
              </div>
            )}
            <div className={`w-12 h-5 ${getPriorityColor(task.priority)} rounded-b-md mr-1 flex items-center justify-center text-white`}>
              {task.priority === 'baixa' && 'B'}
              {task.priority === 'média' && 'M'}
              {task.priority === 'alta' && 'A'}
            </div>
          </div>
          {task.requesterName && task.requesterName !== currentUser.user && (
            <div className='bg-white max-w-max flex items-center gap-1 rounded-bl-lg p-1 px-2 rounded-tr-xl text-gray-700 text-center'>
              <RiMailSendLine />
              <p className="whitespace-nowrap">{task.requesterName} - {task.requesterLoja}</p>
            </div>
          )}


        </div>
      </div>
      {/* Quadrado de prioridade */}
      <div className="mt-2">
        <div className='flex gap-2 justify-between'>
          {/* Botão para abrir o modal com a descrição */}
          <button
            className="text-white bg-blue-700 rounded-lg p-1 shadow-md"
            onClick={handleDescriptionClick} // Substituímos o evento original
          >
            <MdDescription className='text-3xl' />
          </button>
          <button
            className={`text-white bg-purple-700 rounded-lg p-1 shadow-md ${currentUser.user !== task.requester && !task.notDescription ? '!bg-gray-400 cursor-not-allowed' : ''
              }`}
            onClick={() => {
              if (task.notDescription) {
                setIsNotViewModalOpen(true); // Abrir modal de visualização se já existir
              } else {
                setIsNotModalOpen(true); // Abrir modal de criação se não existir
              }
            }}
            disabled={currentUser.user !== task.requester && !task.notDescription} // Desabilita o botão na condição
          >
            <MdError className='text-3xl' />
          </button>

          {/* Botão de orientação (habilitado/desabilitado dependendo de "orientation") */}
          <button
            className={`text-white rounded-lg p-1 shadow-md ${task.orientation ? 'bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={() => setOrientationModalOpen(true)}
            disabled={!task.orientation}  // Desabilitado se não houver orientação
          >
            <RiGuideFill className='text-3xl' />
          </button>

          {task.requestedDueDate && (
            <button
              className={`text-white rounded-lg p-1 shadow-md transition-opacity duration-1000 ease-in-out ${task.requestedDueDateStatus === 'pendente'
                ? 'bg-yellow-500' // Amarelo para pendente
                : task.requestedDueDateStatus === 'aprovado'
                  ? 'bg-green-500' // Verde para autorizado
                  : task.requestedDueDateStatus === 'recusado'
                    ? 'bg-red-500' // Vermelho para negado
                    : 'hidden' // Esconder se não for nenhum dos três
                } ${task.requestedDueDateStatus === 'pendente' && currentUser.user !== task.requesterName
                  ? 'animate-pulse' // Efeito de piscar quando pendente e usuário logado for diferente do requester
                  : ''
                }`}
              onClick={() => handleOpenDueDateDetails(task)}
            >
              <MdOutlineUpdate className="text-3xl" />
            </button>
          )}

          {/* Se descriptionCanceled existir, exibir o botão de cancelamento */}
          {task.descriptionCanceled ? (
            <button
              className="text-white bg-red-700 rounded-lg p-1 shadow-md"
              onClick={() => setCanceledDescriptionModalOpen(true)}
            >
              <ImCancelCircle className='text-3xl' />
            </button>
          ) : (
            // Caso contrário, exibe o botão de dificuldades (habilitado/desabilitado dependendo de "difficulties")
            <button
              className={`text-white rounded-lg p-1 shadow-md ${task.difficulties ? 'bg-orange-700' : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={() => setDifficultiesModalOpen(true)}
              disabled={!task.difficulties}  // Desabilitado se não houver dificuldades
            >
              <SiLevelsdotfyi className='text-3xl' />
            </button>
          )}
        </div>
        <div>
          <div className='flex justify-between mt-4 gap-1'>
            <div className='flex gap-1 items-center'>
              <LuCalendarClock className='text-2xl text-primaryBlueDark' />
              <p className={isDueToday(task.dueDate) ? 'text-red-600' : ''}>
                {new Date(task.dueDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>

              {task.requestedDueDateStatus === 'pendente' && (
                <MdOutlineUpdate className="text-xl text-yellow-500" />
              )}

              {task.requestedDueDateStatus === 'aprovado' && (
                <MdOutlineUpdate className="text-xl text-green-500" />
              )}

              {task.requestedDueDateStatus === 'recusado' && (
                <MdOutlineUpdate className="text-xl text-red-500" />
              )}
            </div>
            <div className='flex gap-1'>
              {task.conclusionDate && (
                <div className='flex gap-1'>
                  <LuCalendarCheck2 className='text-2xl text-primaryBlueDark' />
                  <p className={isDueToday(task.dueDate) ? 'text-red-600' : ''}>
                    {new Date(task.conclusionDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              )}

              {task.canceledDate && (
                <div className='flex gap-1'>
                  <LuCalendarX className='text-2xl text-red-600' /> {/* Ícone para cancelamento */}
                  <p>
                    {new Date(task.canceledDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className='flex justify-between bg-primaryBlueDark mt-3 rounded-t-xl shadow-md px-2'>
            <div className='flex gap-1 justify-center items-center'>
              <p>
                <FaUserTie className=' text-white' />
              </p>
              <p className='text-white'>
                {task.requester}
              </p>
            </div>
            <div
              className={`p-1 m-2 rounded-full shadow-md ${isViewed ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              {isViewed ? <AiFillEye className="text-white text-xl" /> : <AiOutlineEye className="text-white text-xl" />}
            </div>
            <div className='flex'>
              {task.status === 'concluido' && (
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <p className=' text-white'>Concluído</p>
                </div>
              )}
              {task.status === 'pendente' && (
                <div className="flex items-center">
                  <MdPending className="text-yellow-500 mr-2" />
                  <p className=' text-white'>Pendente</p>
                </div>
              )}
              {task.status === 'cancelado' && (
                <div className="flex items-center">
                  <MdCancel className="text-red-500 mr-2" />
                  <p className=' text-white'>Cancelado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MyModal isOpen={isNotViewModalOpen} onClose={() => setIsNotViewModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Detalhes da Notificação</h3>

        <div className="mt-4">
          <h4 className="text-md font-semibold">Descrição:</h4>
          <div className="border p-2 rounded bg-gray-100">
            <div dangerouslySetInnerHTML={{ __html: task.notDescription }} />
          </div>
        </div>

        {task.notAttachments && task.notAttachments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold">Anexos:</h4>
            <ul className="mt-1">
              {task.notAttachments.map((fileUrl, index) => {
                try {
                  // Extrai o nome do arquivo da URL
                  const fileName = fileUrl.substring(
                    fileUrl.lastIndexOf('%2F') + 3,
                    fileUrl.lastIndexOf('?')
                  );

                  return (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2">
                      <span className="text-sm text-gray-800 truncate">{decodeURIComponent(fileName)}</span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline ml-2"
                        download
                      >
                        Baixar
                      </a>
                    </li>
                  );
                } catch (error) {
                  console.error("Erro ao processar URL do arquivo:", fileUrl, error);
                  return null;
                }
              })}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <button className="bg-purple-500 text-white p-2 rounded" onClick={() => setIsNotViewModalOpen(false)}>
            Fechar
          </button>
        </div>
      </MyModal>

      {/* Modal para exibir a descrição da tarefa */}
      <MyModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900">Descrição da Tarefa</h3>

        <div className="mt-4 ql-container ql-snow">
          <div className="ql-editor" dangerouslySetInnerHTML={{ __html: task.description }}></div>
        </div>

        {/* Seção para exibir os anexos */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-gray-900">Anexos:</h4>
            <ul className="mt-4">
              {task.attachments.map((fileUrl, index) => {
                try {
                  // Obtém o último segmento do caminho da URL removendo diretórios
                  const fileName = fileUrl.substring(fileUrl.lastIndexOf('%2F') + 3, fileUrl.lastIndexOf('?'));

                  return (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2">
                      <span className="text-sm text-gray-800 truncate">{decodeURIComponent(fileName)}</span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline ml-2"
                        download
                      >
                        Baixar
                      </a>
                    </li>
                  );
                } catch (error) {
                  console.error("Erro ao processar URL do arquivo:", fileUrl, error);
                  return null;
                }
              })}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <button
            className="bg-blue-500 text-white p-2 rounded"
            onClick={() => setDescriptionModalOpen(false)}
          >
            Fechar
          </button>
        </div>
      </MyModal>

      {/* Modal para exibir a orientação */}
      {
        task.orientation && (
          <MyModal
            isOpen={isOrientationModalOpen}
            onClose={() => setOrientationModalOpen(false)}
          >
            <h3 className="text-lg font-medium leading-6 text-gray-900">Orientação da Tarefa</h3>
            <div className="mt-4 ql-container ql-snow">
              {/* Usando dangerouslySetInnerHTML para exibir o conteúdo formatado */}
              <div className="ql-editor" dangerouslySetInnerHTML={{ __html: task.orientation }}></div>
            </div>
            <div className="mt-4">
              <button
                className="bg-green-500 text-white p-2 rounded"
                onClick={() => setOrientationModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </MyModal>
        )
      }

      {/* Modal para exibir as dificuldades */}
      {
        (task.difficulties || task.correctDifficulties) && (
          <MyModal
            isOpen={isDifficultiesModalOpen}
            onClose={() => setDifficultiesModalOpen(false)}
          >
            <h3 className="text-lg font-medium leading-6 text-gray-900">Dificuldades/Conclusão</h3>
            <div className="mt-6 ql-container ql-snow rounded-xl">
              {/* Exibe as dificuldades */}
              <div className="ql-editor " dangerouslySetInnerHTML={{ __html: task.difficulties }}></div>
            </div>
            {task.notDifficulties && (
              <div className='border mt-4 p-1 rounded-xl'>
                <h4 className="text-md font-medium text-green-700 ">Correção</h4>
                <div className="ql-editor -mt-2" dangerouslySetInnerHTML={{ __html: task.notDifficulties }}></div>
              </div>
            )}
            {task.conclusionFiles && task.conclusionFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-900">Anexos:</h4>
                <ul className="mt-1">
                  {task.conclusionFiles.map((fileUrl, index) => {
                    try {
                      // Extrai o nome do arquivo da URL
                      const fileName = fileUrl.substring(
                        fileUrl.lastIndexOf('%2F') + 3,
                        fileUrl.lastIndexOf('?')
                      );

                      return (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2"
                        >
                          <span className="text-sm text-gray-800 truncate">
                            {decodeURIComponent(fileName)}
                          </span>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline ml-2"
                            download
                          >
                            Baixar
                          </a>
                        </li>
                      );
                    } catch (error) {
                      console.error("Erro ao processar URL do arquivo:", fileUrl, error);
                      return null;
                    }
                  })}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <button
                className="bg-orange-500 text-white p-2 rounded"
                onClick={() => setDifficultiesModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </MyModal>
        )
      }

      <MyModal isOpen={isMarkerModalOpen} onClose={() => setMarkerModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Selecionar Marcador</h3>
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

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="bg-green-500 text-white p-2 rounded"
            onClick={saveMarkerToTask}  // Botão para salvar o marcador na tarefa
          >
            Salvar
          </button>
        </div>
      </MyModal>

      <MyModal isOpen={dueDateDetailsModalOpen} onClose={() => setDueDateDetailsModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Detalhes do Novo Prazo</h3>
          {selectedTaskForDueDateDetails && (
            <div className="mt-4">
              <div>
                <h4 className="text-md font-semibold">Motivo da Solicitação:</h4>
                <div className="border p-2 rounded bg-gray-100">
                  <div dangerouslySetInnerHTML={{ __html: selectedTaskForDueDateDetails.requestedDueDateReason }} />
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-md font-semibold">Novo Prazo Solicitado:</h4>
                <input
                  type="datetime-local"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="border p-2 rounded w-full"
                  disabled={
                    selectedTaskForDueDateDetails?.requesterName === currentUser.user ||
                    selectedTaskForDueDateDetails?.requestedDueDateStatus !== 'pendente'
                  }
                />
              </div>

              {selectedTaskForDueDateDetails?.requesterName !== currentUser.user && (
                <p className='text-xs text-center bg-red-500 mt-2 text-white p-1 rounded-lg'>
                  A hora selecionada deve ser pelo menos 3 horas à frente do horário atual.
                </p>
              )}

              <div className="mt-4">
                <h4 className="text-md font-semibold">Status da Solicitação:</h4>
                <p className={`border p-2 rounded text-center uppercase
            ${selectedTaskForDueDateDetails.requestedDueDateStatus === 'aprovado' ? 'bg-green-200' :
                    selectedTaskForDueDateDetails.requestedDueDateStatus === 'recusado' ? 'bg-red-200' : 'bg-yellow-200'}`}>
                  {selectedTaskForDueDateDetails.requestedDueDateStatus}
                </p>
              </div>
            </div>
          )}

          {selectedTaskForDueDateDetails?.requesterName !== currentUser.user && (
            <div className="mt-6 flex justify-between">
              <button
                className={`p-2 rounded w-1/2 mr-2 ${selectedTaskForDueDateDetails?.requestedDueDateStatus !== 'pendente' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                onClick={() => handleUpdateDueDateStatus('aprovado')}
                disabled={selectedTaskForDueDateDetails?.requestedDueDateStatus !== 'pendente'}
              >
                Autorizar
              </button>

              <button
                className={`p-2 rounded w-1/2 mr-2 ${selectedTaskForDueDateDetails?.requestedDueDateStatus !== 'pendente' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                onClick={() => handleUpdateDueDateStatus('recusado')}
                disabled={selectedTaskForDueDateDetails?.requestedDueDateStatus !== 'pendente'}
              >
                Negar
              </button>
            </div>
          )}

          <div className="mt-4">

          </div>
        </>
      </MyModal>
      <MyModal isOpen={isNotModalOpen} onClose={() => setIsNotModalOpen(false)}>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Solicitar Correção</h3>

        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Descrição <span className="text-red-500">*</span></label>
          <ReactQuill className='h-32 mb-12' value={notDescription} onChange={setNotDescription} />
          {(!notDescription.trim() || notDescription === "<p><br></p>") && (
            <p className="text-red-500 text-xs mt-1">A descrição é obrigatória.</p>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Anexos (máx: 8 arquivos, 85MB cada)</label>
          <input type="file" multiple onChange={handleFileChange} />
          <p className="text-xs text-gray-500">Arquivos suportados: até 8 arquivos, máximo de 85MB cada.</p>
        </div>

        <div className="mt-4">
          <button
            className={`bg-green-500 text-white p-2 rounded ${(!notDescription.trim() || notDescription === "<p><br></p>" || uploadingNotFiles) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSaveNot}
            disabled={!notDescription.trim() || notDescription === "<p><br></p>" || uploadingNotFiles} // Bloqueia o botão se a descrição estiver vazia ou contiver apenas "<p><br></p>"
          >
            {uploadingNotFiles ? <LoadingSpinner /> : "Salvar"}
          </button>
        </div>
      </MyModal>

      {/* Modal para exibir o motivo de cancelamento */}
      {
        task.descriptionCanceled && (
          <MyModal
            isOpen={isCanceledDescriptionModalOpen}
            onClose={() => setCanceledDescriptionModalOpen(false)}
          >
            <h3 className="text-lg font-medium leading-6 text-gray-900">Motivo do Cancelamento</h3>
            <div className="mt-4 ql-container ql-snow">
              {/* Usando dangerouslySetInnerHTML para exibir o conteúdo formatado */}
              <div className="ql-editor" dangerouslySetInnerHTML={{ __html: task.descriptionCanceled }}></div>
            </div>
            <div className="mt-4">
              <button
                className="bg-red-500 text-white p-2 rounded"
                onClick={() => setCanceledDescriptionModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </MyModal>
        )
      }

    </div >
  );
};

export default Task;
