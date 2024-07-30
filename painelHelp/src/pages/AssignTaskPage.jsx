import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import Modal from '../components/Modal/Modal';
import Task from '../components/Task/Task';
import NotificationModal from '../components/NotificationModal/NotificationModal';

const AssignTasksPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [concludeModalOpen, setConcludeModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [conclusionDate, setConclusionDate] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchAssignments();
  }, []);

  const fetchTasks = async () => {
    try {
      const tasksCollection = collection(db, 'tarefas', currentUser.user, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksList);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const citiesCollection = collection(db, 'usuarios');
      const citiesSnapshot = await getDocs(citiesCollection);
      const citiesList = citiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersList = [];
      citiesList.forEach(city => {
        Object.keys(city).forEach(key => {
          if (typeof city[key] === 'object' && city[key].user && city[key].assignment === currentUser.user) {
            usersList.push({ id: key, ...city[key] });
          }
        });
      });

      // Fetch tasks for each user
      for (const user of usersList) {
        const userTasksCollection = collection(db, 'tarefas', user.user, 'tasks');
        const userTasksSnapshot = await getDocs(userTasksCollection);
        const userTasksList = userTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        user.tasks = userTasksList;
      }

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching assignments: ", error);
    }
  };

  const handleCreateTask = async () => {
    const taskId = uuidv4();
    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', taskId);
    await setDoc(taskRef, {
      id: taskId,
      task: newTaskTitle,
      description: newTaskDescription,
      status: 'pendente',
      dueDate: newTaskDueDate,
      requester: currentUser.user
    });
    setModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    fetchTasks();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', taskId);
    await updateDoc(taskRef, {
      status: newStatus
    });
    fetchTasks();
  };

  const handleAssignTask = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (selectedTask && selectedUser) {
      const oldTaskRef = doc(db, 'tarefas', currentUser.user, 'tasks', selectedTask.id);
      const newTaskRef = doc(db, 'tarefas', selectedUser, 'tasks', selectedTask.id);
      await setDoc(newTaskRef, selectedTask);
      await deleteDoc(oldTaskRef);

      // Atualiza o estado local para refletir a mudança
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.user === selectedUser) {
          return {
            ...user,
            tasks: [...user.tasks, selectedTask]
          };
        }
        return user;
      }));

      setUsers(prevUsers => prevUsers.map(user => {
        if (user.user === currentUser.user) {
          return {
            ...user,
            tasks: user.tasks.filter(task => task.id !== selectedTask.id)
          };
        }
        return user;
      }));

      setTasks(prevTasks => prevTasks.filter(task => task.id !== selectedTask.id));
      setModalOpen(false);
      setSelectedTask(null);
      setSelectedUser('');
    }
  };

  const handleConcludeTask = (task) => {
    setSelectedTask(task);
    setConcludeModalOpen(true);
  };

  const handleSaveConclusion = async () => {
    if (selectedTask && conclusionDate) {
      const taskRef = doc(db, 'tarefas', currentUser.user, 'tasks', selectedTask.id);
      await updateDoc(taskRef, {
        status: 'concluido',
        conclusionDate: conclusionDate
      });

      // Atualiza o estado local para refletir a mudança
      setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === selectedTask.id) {
          return { ...task, status: 'concluido', conclusionDate: conclusionDate };
        }
        return task;
      }));

      setUsers(prevUsers => prevUsers.map(user => {
        if (user.user === currentUser.user) {
          return {
            ...user,
            tasks: user.tasks.map(task => {
              if (task.id === selectedTask.id) {
                return { ...task, status: 'concluido', conclusionDate: conclusionDate };
              }
              return task;
            })
          };
        }
        return user;
      }));

      setConcludeModalOpen(false);
      setSelectedTask(null);
      setConclusionDate('');
    }
  };

  return (
    <div className="flex mt-14">
      <div className="flex flex-row-reverse w-full justify-between h-screen">

        <div className='flex flex-col lg:h-screen min-w-[370px] bg-primary   p-4 lg:overflow-y-scroll'>
          <h2 className="text-xl font-bold mb-4 text-white3">
            Usuários e suas Tarefas
          </h2>
          {users.map(user => (
            <div key={user.id} className="mb-4 p-4 border rounded bg-gray-100 shadow-md">
              <h3 className="font-bold">{user.user} - {user.cargo}</h3>
              <div className="mt-2">
                {user.tasks.map(task => (
                  <div key={task.id} className="p-2 border rounded mb-2 bg-white shadow-md">
                    <Task task={task} onStatusChange={handleStatusChange} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>


        <div className='ml-4 mt-4'>
          <button onClick={() => setModalOpen(true)} className="bg-blue-500 text-white p-2 rounded">
            Criar Tarefa
          </button>
          <div className="mt-4">
            {tasks.map(task => (
              <div key={task.id} className="p-2 border rounded mb-2 bg-white shadow-md">
                <Task task={task} onStatusChange={handleStatusChange} />
                <button
                  onClick={() => handleAssignTask(task)}
                  className={`text-white p-1 rounded mt-2 ${task.status === 'concluido' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500'}`}
                  disabled={task.status === 'concluido'}
                >
                  Atribuir Tarefa
                </button>
                <button
                  onClick={() => handleConcludeTask(task)}
                  className={`text-white p-1 rounded mt-2 ml-2 ${task.status === 'concluido' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500'}`}
                  disabled={task.status === 'concluido'}
                >
                  Concluir
                </button>
              </div>
            ))}
          </div>
        </div>
        
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedTask ? (
          <>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Atribuir Tarefa</h3>
            <div className="mt-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              >
                <option value="">Selecione um usuário</option>
                {users.map(user => (
                  <option key={user.id} value={user.user}>
                    {user.user} - {user.cargo}
                  </option>
                ))}
              </select>
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
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Criar Tarefa</h3>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Título da Tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Descrição da Tarefa"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              ></textarea>
              <input
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
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
          </>
        )}
      </Modal>
      <Modal isOpen={concludeModalOpen} onClose={() => setConcludeModalOpen(false)}>
        <>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Concluir Tarefa</h3>
          <div className="mt-2">
            <input
              type="datetime-local"
              value={conclusionDate}
              onChange={(e) => setConclusionDate(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="bg-blue-500 text-white p-2 rounded"
              onClick={handleSaveConclusion}
            >
              Salvar
            </button>
          </div>
        </>
      </Modal>
      <NotificationModal />
    </div>
  );
};

export default AssignTasksPage;
