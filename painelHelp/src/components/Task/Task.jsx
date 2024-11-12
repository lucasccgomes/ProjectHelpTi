import React, { useContext, useEffect, useState } from 'react';
import MyModal from '../MyModal/MyModal'; // Assumindo que o MyModal está no diretório components
import { MdDescription } from "react-icons/md";
import { RiGuideFill } from "react-icons/ri";
import { SiLevelsdotfyi } from "react-icons/si";
import { FaCheckCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { MdPending } from "react-icons/md";
import { LuCalendarClock, LuCalendarCheck2, LuCalendarX } from "react-icons/lu";
import { FaUserTie } from "react-icons/fa";
import { BsPlus } from "react-icons/bs";
import { ImCancelCircle } from "react-icons/im";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { IoBookmarkSharp } from "react-icons/io5";
import Select from 'react-select'; // Importa o react-select
import { db } from '../../firebase';
import { BiBookmarkPlus } from "react-icons/bi";
import { AuthContext } from '../../context/AuthContext';
import { Tooltip as ReactTooltip } from 'react-tooltip';

const Task = ({ task, onStatusChange }) => {
  const [isDescriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [isOrientationModalOpen, setOrientationModalOpen] = useState(false); // Novo estado para o modal de orientação
  const [isDifficultiesModalOpen, setDifficultiesModalOpen] = useState(false); // Novo estado para o modal de dificuldades
  const [isCanceledDescriptionModalOpen, setCanceledDescriptionModalOpen] = useState(false); // Novo estado para o modal de descrição de cancelamento
  const [isMarkerModalOpen, setMarkerModalOpen] = useState(false);
  const [newMarker, setNewMarker] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#000000');
  const [selectedMarker, setSelectedMarker] = useState('');
  const [markers, setMarkers] = useState([]);
  const { currentUser } = useContext(AuthContext);

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

  const calculateDelay = (dueDate) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);

    // Adiciona um dia de tolerância à data de vencimento
    dueDateObj.setDate(dueDateObj.getDate() + 1);

    // Calcula a diferença em milissegundos e converte para dias
    const differenceInTime = today - dueDateObj;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    return differenceInDays > 0 ? differenceInDays : 0;
  };

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);

    // Adiciona um dia de tolerância à data de vencimento
    dueDateObj.setDate(dueDateObj.getDate() + 1);
    return today > dueDateObj;
  };

  useEffect(() => {
    if (!task.conclusionDate && isTaskOverdue(task.dueDate)) { // Adiciona a verificação para o campo conclusionDate
      const daysDelayed = calculateDelay(task.dueDate);

      // Apenas grava se o atraso ainda não foi salvo ou se o valor mudou
      if (!task.atraso || task.atraso !== daysDelayed) {
        const taskRef = doc(db, 'tarefas', task.requester, 'tasks', task.id);
        updateDoc(taskRef, {
          atraso: daysDelayed,
        });
      }
    }
  }, [task]);

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
      console.error("Erro ao buscar marcadores:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMarkers();
    }
  }, [currentUser]);

  // Formatação das opções do select
  const formattedMarkers = markers.map(marker => ({
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
      console.log("Iniciando o salvamento do marcador na tarefa..."); // Log para início da função
      const selectedMarkerObject = markers.find(marker => marker.label === selectedMarker);
      console.log("Marcador selecionado:", selectedMarkerObject); // Log para verificar o objeto do marcador selecionado
      const requesterPath = task.requesterName || task.requester;
      const taskRef = doc(db, 'tarefas', requesterPath, 'tasks', task.id);
      console.log("Referência do documento da tarefa:", taskRef.path); // Log para exibir o caminho onde o documento será salvo

      try {
        const docSnap = await getDoc(taskRef);

        if (docSnap.exists()) {
          console.log("Documento da tarefa encontrado. Atualizando..."); // Log para documento existente
          await updateDoc(taskRef, {
            marker: selectedMarkerObject.label,
            markerColor: selectedMarkerObject.color,
          });
          console.log("Marcador atualizado na tarefa com sucesso:", selectedMarkerObject.label, selectedMarkerObject.color); // Log para confirmação de atualização
        } else {
          console.log("Documento da tarefa não encontrado. Criando novo documento..."); // Log para documento inexistente
          await setDoc(taskRef, {
            marker: selectedMarkerObject.label,
            markerColor: selectedMarkerObject.color,
            // Adicione outros campos obrigatórios aqui
          });
          console.log("Novo documento criado com marcador:", selectedMarkerObject.label, selectedMarkerObject.color); // Log para confirmação de criação
        }

        // Atualize o estado da tarefa na interface
        task.marker = selectedMarkerObject.label;
        task.markerColor = selectedMarkerObject.color;
        setMarkerModalOpen(false);
      } catch (error) {
        console.error("Erro ao salvar marcador na tarefa:", error);
      }
    } else {
      console.warn("Nenhum marcador foi selecionado para salvar."); // Log para caso não haja marcador selecionado
    }
  };

  // Função para adicionar um novo marcador com logs detalhados
  const addMarker = async () => {
    if (newMarker.trim() !== '' && newMarkerColor) {
      console.log("Iniciando a adição de novo marcador..."); // Log para início da função
      const markersDocRef = doc(db, 'ordersControl', 'marcadoresTarefas', currentUser.user, 'marker');
      console.log("Referência do documento de marcadores:", markersDocRef.path); // Log para exibir o caminho do documento onde os marcadores serão salvos

      try {
        const docSnap = await getDoc(markersDocRef);
        const newMarkerObject = { label: newMarker, color: newMarkerColor };
        console.log("Novo marcador a ser adicionado:", newMarkerObject); // Log do objeto do novo marcador

        const existingMarker = docSnap.exists() && docSnap.data().array.some(marker => marker.label === newMarker);
        if (existingMarker) {
          console.warn("Erro: Marcador com esse label já existe."); // Log para marcador duplicado
          return;
        }

        const updatedMarkers = docSnap.exists() ? [...docSnap.data().array, newMarkerObject] : [newMarkerObject];
        await setDoc(markersDocRef, { array: updatedMarkers });
        console.log("Marcadores atualizados no documento:", updatedMarkers); // Log para os marcadores atualizados

        setMarkers((prev) => [...prev, newMarkerObject]);
        setSelectedMarker(newMarker);
        console.log("Novo marcador adicionado e selecionado:", newMarkerObject); // Log para confirmação de adição

        setNewMarker('');
        setNewMarkerColor('#000000');
      } catch (error) {
        console.error("Erro ao adicionar marcador:", error);
      }
    } else {
      console.warn("Nome ou cor do novo marcador inválidos."); // Log para caso o nome ou cor sejam inválidos
    }
  };

  return (
    <div className={`px-4 rounded-t-xl w-full ${isTaskOverdue(task.dueDate) ? 'bg-white' : 'bg-white'}`}>
      <div className='flex gap-2'>
        <div>
          {task.marker && task.markerColor ? (
            <div className=''>
              <IoBookmarkSharp
                className='text-3xl -mt-[0.1rem]'
                style={{ color: task.markerColor }}
                data-tooltip-id="marker-tooltip" // Defina um id para o tooltip
                data-tooltip-content={task.marker} // Defina o conteúdo do tooltip
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
        <div className={`${task.atraso > 0 ? 'bg-red-600' : 'bg-primaryBlueDark'} min-h-[44px] w-full flex justify-between font-semibold rounded-b-xl px-1 pb-1 text-white shadow-md`}>
          <p className=' text-sm text-center w-full px-1'>
            {task.task}
          </p>
          {task.atraso > 0 && (
            <div className='flex gap-1'>
              <p className="text-white text-sm font-semibold">Atraso: {task.atraso} dias</p>
            </div>
          )}
          <div className={`w-12 h-5 ${getPriorityColor(task.priority)} rounded-b-md mr-1 flex items-center justify-center text-white`}>
            {task.priority === 'baixa' && 'B'}
            {task.priority === 'média' && 'M'}
            {task.priority === 'alta' && 'A'}
          </div>
        </div>
      </div>
      {/* Quadrado de prioridade */}
      <div className="mt-2">
        <div className='flex gap-2 justify-between'>
          {/* Botão para abrir o modal com a descrição */}
          <button
            className="text-white bg-blue-700 rounded-lg p-1 shadow-md"
            onClick={() => setDescriptionModalOpen(true)}
          >
            <MdDescription className='text-3xl' />
          </button>

          {/* Botão de orientação (habilitado/desabilitado dependendo de "orientation") */}
          <button
            className={`text-white rounded-lg p-1 shadow-md ${task.orientation ? 'bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={() => setOrientationModalOpen(true)}
            disabled={!task.orientation}  // Desabilitado se não houver orientação
          >
            <RiGuideFill className='text-3xl' />
          </button>

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
            <div className='flex  gap-1'>
              <LuCalendarClock className='text-2xl text-primaryBlueDark' />
              <p className={isDueToday(task.dueDate) ? 'text-red-600' : ''}>
                {new Date(task.dueDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
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
            <div>
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

      {/* Modal para exibir a descrição da tarefa */}
      <MyModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900">Descrição da Tarefa</h3>
        <div className="mt-4 ql-container ql-snow">
          {/* Usando dangerouslySetInnerHTML para exibir o conteúdo formatado */}
          <div className="ql-editor" dangerouslySetInnerHTML={{ __html: task.description }}></div>
        </div>
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
      {task.orientation && (
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
      )}

      {/* Modal para exibir as dificuldades */}
      {task.difficulties && (
        <MyModal
          isOpen={isDifficultiesModalOpen}
          onClose={() => setDifficultiesModalOpen(false)}
        >
          <h3 className="text-lg font-medium leading-6 text-gray-900">Dificuldades Enfrentadas</h3>
          <div className="mt-4 ql-container ql-snow">
            {/* Usando dangerouslySetInnerHTML para exibir o conteúdo formatado */}
            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: task.difficulties }}></div>
          </div>
          <div className="mt-4">
            <button
              className="bg-orange-500 text-white p-2 rounded"
              onClick={() => setDifficultiesModalOpen(false)}
            >
              Fechar
            </button>
          </div>
        </MyModal>
      )}

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


      {/* Modal para exibir o motivo de cancelamento */}
      {task.descriptionCanceled && (
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
      )}

    </div>
  );
};

export default Task;
