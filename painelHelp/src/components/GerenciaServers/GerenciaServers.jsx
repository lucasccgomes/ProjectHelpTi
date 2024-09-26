import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // O caminho do arquivo de configuração do Firebase

function GerenciaServers() {
    const [servers, setServers] = useState([]); // Estado para armazenar todos os servidores
    const [error, setError] = useState(null);
    const [intervalTime, setIntervalTime] = useState(600000); // Estado para controlar o intervalo (em milissegundos)
    const [isIntervalActive, setIsIntervalActive] = useState(false); // Controla se o intervalo está ativo
    const [executedCommands, setExecutedCommands] = useState([]); // Para armazenar os servidores que tiveram comandos executados

    // Função para buscar todos os servidores da coleção Firestore
    const fetchServersData = async () => {
        try {
            const serversCollection = collection(db, 'grenciaServers');
            const serversSnapshot = await getDocs(serversCollection);
            const serversList = serversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setServers(serversList);
            setIsIntervalActive(true); // Ativa o intervalo após carregar os dados

            // Chama fetchStatus imediatamente após carregar os dados
            fetchStatus(serversList);
        } catch (error) {
            console.error('Erro ao buscar dados do Firebase:', error);
            setError('Erro ao buscar os servidores.');
        }
    };

    useEffect(() => {
        fetchServersData(); // Busca as informações ao carregar o componente
    }, []);

    useEffect(() => {
        let intervalId;

        if (isIntervalActive) {
            // Configura o intervalo usando o valor de `intervalTime`
            intervalId = setInterval(() => {
                fetchStatus(servers); // Passa a lista atual de servidores
            }, intervalTime);
        }

        // Limpa o intervalo quando o componente for desmontado ou quando o `intervalTime` mudar
        return () => clearInterval(intervalId);
    }, [servers, intervalTime, isIntervalActive]); // O intervalo muda se `intervalTime` ou `isIntervalActive` mudarem

    const fetchStatus = async (serversToCheck) => {
        try {
            serversToCheck.forEach(async (server) => {
                const response = await fetch('http://localhost:3000/check-server', {
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
                            s.id === server.id ? { ...s, statusData: data.data } : s
                        )
                    );

                    // Verifica se as condições estão presentes
                    const statusData = data.data;
                    if (
                        statusData.Last_Error && statusData.Last_Error.includes('Slave SQL thread retried transaction 10 time(s) in vain, giving up. Consider raising the value of the slave_transaction_retries variable.') &&
                        (statusData.Seconds_Behind_Master === null || statusData.Seconds_Behind_Master === 'Null') &&
                        statusData.Slave_SQL_Running === 'No'
                    ) {
                        // Executar comando de parar e reiniciar o slave
                        executeSlaveCommands(server.id);
                    }
                } else {
                    setError(data.message);
                }
            });
        } catch (err) {
            setError(err.message);
        }
    };

    const executeSlaveCommands = async (server, command) => {
        try {
            const response = await fetch(`http://localhost:3000/execute-commands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    host: server.host, // Certifique-se de passar o host corretamente
                    port: server.port, // Certifique-se de passar a porta corretamente
                    sshUser: server.sshUser, // Certifique-se de passar o usuário SSH corretamente
                    sshPassword: server.sshPassword, // Certifique-se de passar a senha SSH corretamente
                    mysqlPassword: server.mysqlPassword, // Certifique-se de passar a senha MySQL corretamente
                    commands: [command], // Comando passado para ser executado (por exemplo, STOP SLAVE ou START SLAVE)
                }),
            });

            const data = await response.json();
            if (data.status === 'success') {
                console.log(`Comando '${command}' executado com sucesso no servidor ${server.host}`);
            } else {
                console.error(`Erro ao executar o comando '${command}' no servidor ${server.host}: ${data.message}`);
            }
        } catch (err) {
            console.error(`Erro ao executar o comando '${command}' no servidor ${server.host}: ${err.message}`);
        }
    };


    // Função para parar o Slave
    const handleStopSlave = (serverId) => {
        executeSlaveCommands(serverId, 'STOP SLAVE;');
    };

    // Função para iniciar o Slave
    const handleStartSlave = (serverId) => {
        executeSlaveCommands(serverId, 'START SLAVE;');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Check MySQL Server Status</h1>

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
                servers.map((server) => (
                    <div key={server.id} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full">
                        <h2 className="text-xl font-semibold mb-4">{`Server: ${server.id}`}</h2>
                        {server.statusData && (
                            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                                <h2 className="text-xl font-semibold mb-4">MySQL Slave Status:</h2>
                                <ul className="list-none pl-0">
                                   
                                 
                                        <li className="text-gray-700">
                                        <strong>Slave_IO_State:</strong> {server.statusData.Slave_IO_State || ''}
                                        </li>
                                 

                                 
                                        <li className="text-gray-700">
                                            <strong>Master_Host:</strong> {server.statusData.Master_Host}
                                        </li>
                             

                              
                                        <li className="text-gray-700">
                                            <strong>Master_User:</strong> {server.statusData.Master_User}
                                        </li>
                            

                                        <li className="text-gray-700">
                                            <strong>Master_Port:</strong> {server.statusData.Master_Port}
                                        </li>
                             

                               
                                        <li className="text-gray-700">
                                            <strong>Connect_Retry:</strong> {server.statusData.Connect_Retry}
                                        </li>
                             

                                        <li className="text-gray-700">
                                            <strong>Master_Log_File:</strong> {server.statusData.Master_Log_File}
                                        </li>
                             

                                
                                        <li className="text-gray-700">
                                            <strong>Read_Master_Log_Pos:</strong> {server.statusData.Read_Master_Log_Pos}
                                        </li>
                           

                              
                                        <li className="text-gray-700">
                                            <strong>Relay_Log_File:</strong> {server.statusData.Relay_Log_File}
                                        </li>
                        

                                 
                                        <li className="text-gray-700">
                                            <strong>Relay_Log_Pos:</strong> {server.statusData.Relay_Log_Pos}
                                        </li>
                                 

                                   
                                        <li className="text-gray-700">
                                            <strong>Relay_Master_Log_File:</strong> {server.statusData.Relay_Master_Log_File}
                                        </li>
                                 

                                  
                                        <li className="text-gray-700">
                                            <strong>Slave_IO_Running:</strong> {server.statusData.Slave_IO_Running}
                                        </li>
                               

                               
                                        <li className="text-gray-700">
                                            <strong>Slave_SQL_Running:</strong> {server.statusData.Slave_SQL_Running}
                                        </li>
                                

                                   
                                        <li className="text-gray-700">
                                            <strong>Replicate_Do_DB:</strong> {server.statusData.Replicate_Do_DB}
                                        </li>
                                   

                                  
                                        <li className="text-gray-700">
                                            <strong>Replicate_Wild_Ignore_Table:</strong> {server.statusData.Replicate_Wild_Ignore_Table}
                                        </li>
                                  

                                
                                        <li className="text-gray-700">
                                            <strong>Last_Errno:</strong> {server.statusData.Last_Errno}
                                        </li>
                                  

                                  
                                        <li className="text-gray-700">
                                            <strong>Last_Error:</strong> {server.statusData.Last_Error}
                                        </li>
                                   

                                 
                                        <li className="text-gray-700">
                                            <strong>Skip_Counter:</strong> {server.statusData.Skip_Counter}
                                        </li>
                                  

                                   
                                        <li className="text-gray-700">
                                            <strong>Exec_Master_Log_Pos:</strong> {server.statusData.Exec_Master_Log_Pos}
                                        </li>
                                   

                                   
                                        <li className="text-gray-700">
                                            <strong>Relay_Log_Space:</strong> {server.statusData.Relay_Log_Space}
                                        </li>
                                  

                                 
                                        <li className="text-gray-700">
                                            <strong>Until_Condition:</strong> {server.statusData.Until_Condition}
                                        </li>
                                

                                   
                                        <li className="text-gray-700">
                                            <strong>Until_Log_Pos:</strong> {server.statusData.Until_Log_Pos}
                                        </li>
                                  

                                
                                        <li className="text-gray-700">
                                            <strong>Master_SSL_Allowed:</strong> {server.statusData.Master_SSL_Allowed}
                                        </li>
                                 

                                    
                                        <li className="text-gray-700">
                                            <strong>Seconds_Behind_Master:</strong> {server.statusData.Seconds_Behind_Master}
                                        </li>
                                   

                                   
                                        <li className="text-gray-700">
                                            <strong>Master_SSL_Verify_Server_Cert:</strong> {server.statusData.Master_SSL_Verify_Server_Cert}
                                        </li>
                                  

                                 
                                        <li className="text-gray-700">
                                            <strong>Last_IO_Errno:</strong> {server.statusData.Last_IO_Errno}
                                        </li>
                                  

                                 
                                        <li className="text-gray-700">
                                            <strong>Last_IO_Error:</strong> {server.statusData.Last_IO_Error}
                                        </li>
                                  

                                
                                        <li className="text-gray-700">
                                            <strong>Last_SQL_Errno:</strong> {server.statusData.Last_SQL_Errno}
                                        </li>
                                  

                           
                                        <li className="text-gray-700">
                                            <strong>Master_Server_Id:</strong> {server.statusData.Master_Server_Id}
                                        </li>
                                

                               
                                        <li className="text-gray-700">
                                            <strong>Master_UUID:</strong> {server.statusData.Master_UUID}
                                        </li>
                                  

                               
                                        <li className="text-gray-700">
                                            <strong>Master_Info_File:</strong> {server.statusData.Master_Info_File}
                                        </li>
                                  

                                
                                        <li className="text-gray-700">
                                            <strong>SQL_Delay:</strong> {server.statusData.SQL_Delay}
                                        </li>
                                

                                    
                                        <li className="text-gray-700">
                                            <strong>SQL_Remaining_Delay:</strong> {server.statusData.SQL_Remaining_Delay}
                                        </li>
                                  

                                   
                                        <li className="text-gray-700">
                                            <strong>Slave_SQL_Running_State:</strong> {server.statusData.Slave_SQL_Running_State}
                                        </li>
                                   

                                
                                        <li className="text-gray-700">
                                            <strong>Master_Retry_Count:</strong> {server.statusData.Master_Retry_Count}
                                        </li>
                                  

                                </ul>
                            </div>
                        )}

                        {/* Botões para Stop Slave e Start Slave */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => executeSlaveCommands(server, 'STOP SLAVE;')}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
                            >
                                Stop Slave
                            </button>

                            <button
                                onClick={() => executeSlaveCommands(server, 'START SLAVE;')}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Start Slave
                            </button>
                        </div>

                        {executedCommands.includes(server.id) && (
                            <div className="text-green-500">
                                Comandos 'STOP SLAVE;' e 'START SLAVE;' executados no servidor {server.id}.
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p>Nenhum servidor encontrado.</p>
            )}
        </div>
    );
}

export default GerenciaServers;
