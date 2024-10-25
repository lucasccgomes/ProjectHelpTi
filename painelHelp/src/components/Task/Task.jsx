import React, { useEffect, useState } from 'react';
import MyModal from '../MyModal/MyModal'; // Assumindo que o MyModal está no diretório components
import { MdDescription } from "react-icons/md";
import { RiGuideFill } from "react-icons/ri";
import { SiLevelsdotfyi } from "react-icons/si";
import { FaCheckCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import { MdPending } from "react-icons/md";
import { LuCalendarClock, LuCalendarCheck2, LuCalendarX } from "react-icons/lu";
import { FaUserTie } from "react-icons/fa";
import { ImCancelCircle } from "react-icons/im";
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../../firebase';


const Task = ({ task, onStatusChange }) => {
  const [isDescriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [isOrientationModalOpen, setOrientationModalOpen] = useState(false); // Novo estado para o modal de orientação
  const [isDifficultiesModalOpen, setDifficultiesModalOpen] = useState(false); // Novo estado para o modal de dificuldades
  const [isCanceledDescriptionModalOpen, setCanceledDescriptionModalOpen] = useState(false); // Novo estado para o modal de descrição de cancelamento


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

    // Calcula a diferença em milissegundos e converte para dias
    const differenceInTime = today - dueDateObj;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    return differenceInDays > 0 ? differenceInDays : 0;
  };

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    return today > dueDateObj;
  };

  useEffect(() => {
    if (isTaskOverdue(task.dueDate)) {
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

  return (
    <div className={`px-4 rounded-t-xl w-full ${isTaskOverdue(task.dueDate) ? 'bg-white' : 'bg-white'}`}>
      <div className={`${isTaskOverdue(task.dueDate) ? 'bg-red-600' : 'bg-primaryBlueDark'} flex justify-between font-semibold rounded-b-xl px-1 pb-1 text-white shadow-md`}>
        <p className='ml-1 text-sm'>
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
