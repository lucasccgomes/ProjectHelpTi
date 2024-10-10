import { useState, useEffect } from 'react';
import axios from 'axios';

function MonitorMaquinas() {
  const [computers, setComputers] = useState([]);
  const [error, setError] = useState('');

  const SERVER_URL = 'https://45fc-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/api/computers'; // Substitua pela URL correta

  // Função para buscar o status das máquinas
  const fetchComputers = async () => {
    try {
      const res = await axios.get(SERVER_URL);
      setComputers(res.data);
    } catch (error) {
      console.error('Erro ao buscar status das máquinas:', error);
      setError('Erro ao buscar status das máquinas');
    }
  };

  // UseEffect para buscar dados ao carregar o componente
  useEffect(() => {
    fetchComputers();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Monitoramento de Máquinas Online</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 border-b">ID da Máquina</th>
              <th className="py-2 border-b">Status</th>
              <th className="py-2 border-b">Última Atividade</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(computers).map(([computerId, details]) => (
              <tr key={computerId}>
                <td className="py-2 border-b">{computerId}</td>
                <td className={`py-2 border-b ${details.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {details.status}
                </td>
                <td className="py-2 border-b">
                  {new Date(details.timestamp).toLocaleString('pt-BR', { timeZone: 'UTC' }) || 'Data inválida'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={fetchComputers}
          className="px-4 py-2 mt-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Atualizar Status
        </button>
      </div>
    </div>
  );
}

export default MonitorMaquinas;
