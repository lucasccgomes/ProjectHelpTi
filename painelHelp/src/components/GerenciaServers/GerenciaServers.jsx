import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import AlertModal from '../AlertModal/AlertModal';
import { IoIosAddCircleOutline } from "react-icons/io";
import MyModal from '../MyModal/MyModal';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';


// Defina o token de autenticação aqui
const AUTH_TOKEN = 'drogalira_04799139936742208525x!TokenSecure';

export default function GerenciaServer() {
  const [servers, setServers] = useState([]);
  const [slaveStatus, setSlaveStatus] = useState([]);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalLoading, setAlertModalLoading] = useState(false);
  const [showOkButton, setShowOkButton] = useState(true);
  const [newServer, setNewServer] = useState({ loja: '', host: '', port: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showAddServerModal, setShowAddServerModal] = useState(false); // Modal de Adicionar Servidor
  const [showStatusModal, setShowStatusModal] = useState(false); // Modal de Status
  const [loadingButton, setLoadingButton] = useState(null); // Estado para o botão que está carregando
  const [loadingCorrigir, setLoadingCorrigir] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState({});

  const SERVER_CONTROL_SLAVE_API = import.meta.env.VITE_SERVER_CONTROL_SLAVE_API;
  const SERVER_SHOW_STATUS_API = import.meta.env.VITE_SERVER_SHOW_STATUS_API;
  const SERVER_CHECK_API = import.meta.env.VITE_SERVER_CHECK_API;

  const getBackgroundColor = (situation) => {
    if (situation === 'Servidor Inacessível') return 'bg-gray-500';
    if (situation === 'SQL Parado') return 'bg-yellow-500';
    if (situation === 'Conexão Parada') return 'bg-orange-600';
    if (situation === 'SQL sem Replicação') return 'bg-red-600';
    if (situation === 'SQL Replicando Lentamente') return 'bg-blue-500';
    return 'bg-green-600'; // Cor padrão para status normal
  };

  // Função para validar Porta
  const isValidPort = (port) => /^[0-9]{1,5}$/.test(port) && port >= 1 && port <= 65535;


  // Função para validar e formatar IP automaticamente
  const formatIP = (value) => {
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.').map(part => part.slice(0, 3));
    return parts.join('.').slice(0, 15);
  };

  // Função para adicionar servidor no Firebase
  const handleAddServer = async () => {
    setIsSaving(true); // Mostra o loading
    const documentId = newServer.loja.replace(/\s+/g, '-');

    try {
      await setDoc(doc(db, 'grenciaServers', documentId), {
        Loja: newServer.loja,
        host: newServer.host,
        port: newServer.port,
      });
      setSaveMessage("Servidor adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar servidor:", error);
      setSaveMessage("Erro ao adicionar servidor.");
    } finally {
      setIsSaving(false); // Oculta o loading e mostra a mensagem
    }
  };

  // Função para carregar os dados dos servidores do Firebase
  const loadServers = async () => {
    try {
      const serversCollection = collection(db, 'grenciaServers');
      const serversSnapshot = await getDocs(serversCollection);
      const serversList = serversSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServers(serversList);
    } catch (error) {
      console.error('Erro ao carregar os servidores:', error);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const controlSlave = async (host, port, action, serverName) => {
    try {
      const response = await fetch(SERVER_CONTROL_SLAVE_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`, // Inclui o token no cabeçalho
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ host, port, action, serverName }),
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao controlar o slave:', error);
      return false;
    }
  };

  const getSlaveStatus = async (host, port, serverName) => {
    try {
      const response = await fetch(SERVER_SHOW_STATUS_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`, // Inclui o token no cabeçalho
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ host, port, serverName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.status === 'object' && data.status !== null) {
          setSlaveStatus(data.status);
          setShowStatusModal(true);
        } else {
          setAlertModalMessage('Falha ao interpretar o status do slave');
          setAlertModalOpen(true);
        }
      } else {
        setAlertModalMessage('Erro ao obter o status do slave');
        setAlertModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar o status do slave:', error);
      setAlertModalMessage('Erro ao obter o status do slave');
      setAlertModalOpen(true);
    }
  };

  const handleCorrigir = async (host, port, serverId) => {
    setLoadingButtons((prev) => ({ ...prev, [serverId]: true }));
    try {
      const stopSuccess = await controlSlave(host, port, 'StopSlave');
      if (stopSuccess) {
        await controlSlave(host, port, 'StartSlave');
        const checkResponse = await fetch(SERVER_CHECK_API, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ host }),
        });

        if (checkResponse.ok) {
          setAlertModalMessage('Correção Concluída');
        } else {
          setAlertModalMessage('Erro ao verificar o status do servidor');
        }
      } else {
        setAlertModalMessage('Erro ao aplicar correção');
      }
    } catch (error) {
      console.error('Erro ao corrigir:', error);
      setAlertModalMessage('Erro inesperado na correção');
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [serverId]: false }));
      setAlertModalOpen(true);
    }
  };

  const closeModal = () => {
    setShowStatusModal(false);
    setSlaveStatus([]);
  };

  const closeAlertModal = () => {
    setAlertModalOpen(false);
    setAlertModalMessage('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-altBlue">
      <div className='w-full bg-primaryBlueDark p-2 rounded-lg mb-3 shadow-md mt-8'>
        <div className='flex flex-row justify-between mb-2'>
          <div></div>
          <h1 className="text-xl font-semibold text-center mb-4 text-white">MySQL Slave Control</h1>
          <div>
            <button
              onClick={() => setShowAddServerModal(true)} // Abre o modal de Adicionar Servidor
              className="bg-green-600 text-white p-2 rounded hover:bg-green-500 shadow-md"
            >
              <IoIosAddCircleOutline className='text-xl lg:text-2xl' />
            </button>
          </div>
        </div>
      
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {servers.map((server) => {
          return (
            <div key={server.id} className='bg-white px-1 rounded-lg shadow-lg'>
              <div className={`px-4 pb-4 rounded-lg `}>
                <div className='flex gap-1 flex-col justify-center items-center'>
                  <h2 className="text-md bg-altBlue text-white p-1 rounded-b-md">{server.Loja}</h2>
                  <p className="text-sm bg-gray-500 text-white p-1 rounded-md">{server.host}</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleCorrigir(server.host, server.port, server.id)}
                    className={`w-full ${loadingButtons[server.id] ? 'bg-gray-500 cursor-wait' : 'bg-primaryBlueDark'
                      } text-white p-2 rounded`}
                  >
                    {loadingButtons[server.id] ? 'Corrigindo...' : 'Corrigir'}
                  </button>
                  <button
                    onClick={async () => {
                      setLoadingButton(`status-${server.id}`); // Define o botão atual como carregando
                      await getSlaveStatus(server.host, server.port, server.Loja); // Chama a função de status
                      setLoadingButton(null); // Reseta o estado de carregamento após a resposta
                    }}
                    className={`w-full ${loadingButton === `status-${server.id}` ? 'bg-gray-500 cursor-wait' : 'bg-yellow-500 hover:bg-yellow-600'
                      } text-white p-2 rounded`}
                    disabled={loadingButton === `status-${server.id}`} // Desabilita o botão enquanto está carregando
                  >
                    {loadingButton === `status-${server.id}` ? <LoadingSpinner /> : 'Status'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onRequestClose={closeAlertModal}
        title="Processo em andamento"
        message={alertModalMessage}
        showOkButton={showOkButton}
        loading={alertModalLoading}
      />

      <MyModal
        isOpen={showStatusModal}
        onClose={closeModal}
      >
        <div className="py-4 rounded lg:w-[473px]">
          <h2 className="text-xl font-semibold mb-2">Slave Status</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="mb-4">
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
        </div>
      </MyModal>


      <MyModal isOpen={showAddServerModal} onClose={() => { setShowAddServerModal(false); setSaveMessage(''); setNewServer({ loja: '', host: '', port: '' }); }}>
        <div className="p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Adicionar Servidor</h2>
          {isSaving ? (
            <LoadingSpinner /> // Mostra o spinner de loading durante o salvamento
          ) : saveMessage ? (
            <p className="text-green-600 font-semibold">{saveMessage}</p> // Mostra a mensagem de sucesso ou erro
          ) : (
            <>
              <input
                type="text"
                placeholder="Loja"
                value={newServer.loja}
                onChange={(e) => setNewServer({ ...newServer, loja: e.target.value.replace(/\//g, '') })}
                className="border p-2 mb-4 w-full"
              />
              <input
                type="text"
                placeholder="IP (ex: 192.168.0.1)"
                value={newServer.host}
                onChange={(e) => setNewServer({ ...newServer, host: formatIP(e.target.value) })}
                className="border p-2 mb-4 w-full"
              />
              <input
                type="text"
                placeholder="Porta (ex: 8080)"
                value={newServer.port}
                onChange={(e) => setNewServer({ ...newServer, port: e.target.value })}
                className="border p-2 mb-4 w-full"
              />
              <button onClick={handleAddServer} className="bg-blue-600 text-white p-2 rounded w-full">
                Salvar
              </button>
            </>
          )}
        </div>
      </MyModal>


    </div>
  );
}
