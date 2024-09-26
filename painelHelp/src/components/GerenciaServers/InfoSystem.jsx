import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // O caminho do arquivo de configuração do Firebase
import MyModal from '../MyModal/MyModal';
import SystemUsageChart from './SystemUsageChart ';

function MonitorSystemUsage() {
    const [servers, setServers] = useState([]); // Estado para armazenar todos os servidores
    const [error, setError] = useState(null);
    const [intervalTime, setIntervalTime] = useState(600000); // Estado para controlar o intervalo (em milissegundos)
    const [isIntervalActive, setIsIntervalActive] = useState(false); // Controla se o intervalo está ativo
    const [selectedServer, setSelectedServer] = useState(null); // Server selecionado para o terminal
    const [isModalOpen, setIsModalOpen] = useState(false); // Controle do estado do modal

    // Função para buscar todos os servidores da coleção Firestore
    const fetchServersData = async () => {
        try {
            const serversCollection = collection(db, 'grenciaServers');
            const serversSnapshot = await getDocs(serversCollection);
            const serversList = serversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setServers(serversList);
            setIsIntervalActive(true); // Ativa o intervalo após carregar os dados

            // Chama fetchSystemUsage imediatamente após carregar os dados
            fetchSystemUsage(serversList);
        } catch (error) {
            console.error('Erro ao buscar dados do Firebase:', error);
            setError('Erro ao buscar os servidores.');
        }
    };

    useEffect(() => {
        fetchServersData(); // Busca as informações ao carregar o componente
    }, []);

    const fetchSystemUsage = async (serversToCheck) => {
        try {
            serversToCheck.forEach(async (server) => {
                const response = await fetch('http://localhost:3000/check-system-usage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(server), // Envia os dados do servidor individual
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setServers((prevServers) =>
                        prevServers.map((s) =>
                            s.id === server.id ? { ...s, usageData: data.data } : s
                        )
                    );
                } else {
                    setError(data.message);
                }
            });
        } catch (err) {
            setError(err.message);
        }
    };

    // Função para abrir o modal
    const openTerminal = (server) => {
        setSelectedServer(server); // Defina o servidor atual para o terminal
        setIsModalOpen(true); // Abra o modal
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Monitorar Uso de CPU, RAM, Swap e SSD</h1>

            {/* Controle do tempo de atualização */}
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Atualizar a cada (ms): </label>
                <input
                    type="number"
                    value={intervalTime}
                    onChange={(e) => setIntervalTime(Number(e.target.value))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Intervalo em ms"
                />
            </div>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            {/* Exibindo os dados de cada servidor */}
            {servers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map((server) => (
                        <div key={server.id} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full">
                            <h2 className="text-xl font-semibold mb-4">{`Server: ${server.id}`}</h2>
                            {server.usageData && (
                                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                                    <h2 className="text-xl font-semibold mb-4">System Usage:</h2>
                                    {/* Gráfico de uso da CPU, RAM e Swap */}
                                    <SystemUsageChart
                                        cpuUsage={server.usageData.cpuUsage}
                                        ramUsage={server.usageData.ramUsage}
                                        swapUsage={server.usageData.swapUsage}
                                    />
                                    {/* Botão Terminal */}
                                    <button
                                        onClick={() => openTerminal(server)}
                                        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Terminal
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p>Nenhum servidor encontrado.</p>
            )}

            {/* Modal de Terminal */}
            <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl font-bold mb-4">{`Terminal do Server: ${selectedServer?.id}`}</h2>
                {/* Simula um terminal */}
                <div className="bg-black text-white p-4 rounded h-64 overflow-y-auto">
                    <p>Terminal do servidor em execução aqui...</p>
                </div>
            </MyModal>
        </div>
    );
}

export default MonitorSystemUsage;
