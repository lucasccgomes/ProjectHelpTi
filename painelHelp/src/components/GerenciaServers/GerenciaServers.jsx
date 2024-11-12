import { useState } from 'react';

export default function GerenciaServer() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [slaveStatus, setSlaveStatus] = useState([]);

  const handleOkClick = () => {
    if (host && port) {
      setShowControls(true);
    }
  };

  const controlSlave = async (action) => {
    try {
      const response = await fetch('https://api.drogalira.com.br/api/control-slave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, action }),
      });

      if (response.ok) {
        alert(`${action} executed successfully`);
      } else {
        alert(`Failed to execute ${action}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`An error occurred while executing ${action}`);
    }
  };

  const getSlaveStatus = async () => {
    try {
      const response = await fetch('https://api.drogalira.com.br/api/show-status-slave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port }),
      });
  
      if (response.ok) {
        const data = await response.json();
  
        // Assegure que `data.status` é um objeto com chave-valor
        if (typeof data.status === 'object' && data.status !== null) {
          setSlaveStatus(data.status); // Define o objeto de status no estado
          setShowModal(true); // Exibe o modal
        } else {
          alert('Failed to parse slave status');
        }
      } else {
        alert('Failed to get slave status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while fetching the slave status');
    }
  };
  

  const closeModal = () => {
    setShowModal(false);
    setSlaveStatus([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="text-xl font-semibold text-center mb-4">MySQL Slave Control</h1>
        <input
          type="text"
          placeholder="Host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          placeholder="Port"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleOkClick}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          OK
        </button>

        {showControls && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => controlSlave('StartSlave')}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              StartSlave
            </button>
            <button
              onClick={() => controlSlave('StopSlave')}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
            >
              StopSlave
            </button>
            <button
              onClick={getSlaveStatus}
              className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
            >
              Show Slave Status
            </button>
          </div>
        )}
      </div>

      {showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
    <div className="bg-white p-4 rounded shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-2">Slave Status</h2>
      <div className="max-h-60 overflow-y-auto"> {/* Define a altura máxima e a rolagem para a tabela */}
        <table className="table-auto w-full mb-4">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Column</th>
              <th className="px-4 py-2 border">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(slaveStatus).map(([key, value]) => (
              <tr key={key}>
                <td className="px-4 py-2 border font-semibold">{key}</td>
                <td className="px-4 py-2 border">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={closeModal}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}
