import React from 'react';

const Task = ({ task, onStatusChange }) => (
  <div>
    <span className="font-bold cursor-pointer">{task.task}</span>
    <div className="mt-2">
      <p><strong>Descrição:</strong> {task.description}</p>
      <p><strong>Prazo:</strong> {task.dueDate}</p>
      <p><strong>Solicitante:</strong> {task.requester}</p>
      <p><strong>Status:</strong> {task.status}</p>
    </div>
  </div>
);

export default Task;
