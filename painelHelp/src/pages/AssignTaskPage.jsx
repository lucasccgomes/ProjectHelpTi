import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AssignTasksPage = () => {
  const [cities, setCities] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesCollection = collection(db, 'usuarios');
        const citiesSnapshot = await getDocs(citiesCollection);
        const citiesList = citiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched Cities: ", citiesList); // Logando as cidades obtidas
        setCities(citiesList);
      } catch (error) {
        console.error("Error fetching cities: ", error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(city => city.id === selectedCity);
      if (city) {
        const usersList = [];
        Object.keys(city).forEach(key => {
          if (typeof city[key] === 'object' && city[key].user) {
            usersList.push({ id: key, ...city[key] });
          }
        });
        console.log("Fetched Users for City: ", usersList); // Logando os usuários da cidade selecionada
        setUsers(usersList);
      }
    } else {
      setUsers([]);
    }
  }, [selectedCity, cities]);

  const handleAssignTask = async () => {
    console.log("Selected City: ", selectedCity);
    console.log("Selected User: ", selectedUser);
    console.log("Selected Task: ", selectedTask);
    console.log("Task Description: ", taskDescription);
    console.log("Due Date: ", dueDate);

    if (selectedUser && selectedTask && taskDescription && dueDate) {
      try {
        const taskRef = doc(db, 'tarefas', selectedUser, 'tasks', selectedTask);
        await setDoc(taskRef, {
          task: selectedTask,
          description: taskDescription,
          status: 'pendente',
          dueDate: dueDate
        });
        setSelectedTask('');
        setTaskDescription('');
        setDueDate('');
        alert('Task assigned successfully!');
      } catch (error) {
        console.error("Error assigning task: ", error);
      }
    } else {
      alert('Please select a city, user, task, enter a task description, and set a due date.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Assign Task</h1>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
          Select City
        </label>
        <select
          id="city"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Select a city</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.cidade || city.id}
            </option>
          ))}
        </select>
      </div>
      {users.length > 0 && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user">
            Select User
          </label>
          <select
            id="user"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.user} - {user.loja}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="task">
          Task
        </label>
        <input
          id="task"
          type="text"
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taskDescription">
          Task Description
        </label>
        <textarea
          id="taskDescription"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="4"
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
          Due Date and Time
        </label>
        <input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={handleAssignTask}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Assign Task
        </button>
      </div>
    </div>
  );
};

export default AssignTasksPage;
