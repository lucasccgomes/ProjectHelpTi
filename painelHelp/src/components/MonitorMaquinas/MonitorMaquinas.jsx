import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Certifique-se de que o caminho está correto
import MyModal from '../MyModal/MyModal'; // Certifique-se de que o caminho está correto
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { SiPaloaltosoftware } from "react-icons/si";
import { FaNetworkWired } from "react-icons/fa";
import { IoHardwareChipOutline } from "react-icons/io5";
import Dropdown from '../Dropdown/Dropdown'; // Certifique-se de que o caminho está correto

const MonitorMaquinas = () => {
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]); // Estado para máquinas filtradas
  const [selectedStore, setSelectedStore] = useState('Lira 01'); // Estado para loja selecionada
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSoftwareModalOpen, setIsSoftwareModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Função para buscar máquinas do Firestore
  const fetchMachines = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'machines'));
      const machinesList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(machine => machine.id !== 'urlApiNgrok'); // Ignora máquinas com o ID 'urlApiNgrok'

      setMachines(machinesList);
      setFilteredMachines(machinesList); // Inicializa máquinas filtradas
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    }
  };

  // Função para filtrar máquinas pela loja
  const filterMachinesByStore = (store) => {
    const filtered = machines.filter(machine => machine.loja === store);
    setFilteredMachines(filtered);
  };

  useEffect(() => {
    fetchMachines(); // Buscar informações ao montar o componente

    // Atualiza a lista de máquinas a cada 10 minutos
    const intervalId = setInterval(() => {
      fetchMachines();
    }, 10 * 60 * 1000); // 10 minutos em milissegundos

    // Limpa o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    filterMachinesByStore(selectedStore); // Filtra as máquinas toda vez que a loja selecionada mudar
  }, [selectedStore, machines]); // Dependências para filtrar máquinas

  // Funções para abrir os modais
  const openModal = (machine, modalType) => {
    setSelectedMachine(machine);
    switch (modalType) {
      case 'printers':
        setIsPrintModalOpen(true);
        break;
      case 'software':
        setIsSoftwareModalOpen(true);
        break;
      case 'network':
        setIsNetworkModalOpen(true);
        break;
      case 'hardware':
        setIsHardwareModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Função para formatar a data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Retorna 'N/A' se a data não estiver disponível
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); // Formata a data para BR-SP
  };

  return (
    <div className="p-4 pt-20 bg-altBlue">

      <div className='bg-primaryBlueDark p-4 rounded-xl shadow-xl'>
        <h1 className="lg:text-2xl lg:font-bold font-semibold text-white">Monitoramento de Computadores</h1>
        {/* Componente Dropdown para selecionar a loja */}
        <Dropdown
          options={['Lira 01', 'Lira 02', 'Lira 03', 'Lira 04', 'Lira 05', 'Lira 06', 'Lira 07', 'Lira 08', 'Lira 09', 'Lira 10', 'Lira 11', 'Lira 12', 'Lira 13', 'Lira 14', 'Lira 16', 'Lira 17', 'Lira 18', 'Lira 19', 'Lira 20', 'Lira 21', 'Lira 22', 'Lira 23', 'Lira CD']} // Opções do dropdown
          selected={selectedStore}
          onSelectedChange={setSelectedStore} // Atualiza a loja selecionada
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {filteredMachines.map(machine => (
          <div
            key={machine.id}
            className={`p-4 shadow-md rounded-xl flex flex-col ${machine.status === 'On' ? 'bg-green-600' : 'bg-red-600'}`} // Adicionando a classe de fundo baseada no status
          >
            <div className='bg-white p-2 rounded-xl'>
              <div className='flex justify-between'>
                <div>
                  <div className='flex justify-between -mt-2 mb-2 text-xl font-bold text-white'>
                    <h2 className={`p-2 shadow-md rounded-b-xl flex flex-col ${machine.status === 'On' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {machine.loja}
                    </h2>
                    <p className={`p-2 shadow-md rounded-b-xl flex flex-col ${machine.status === 'On' ? 'bg-green-600' : 'bg-red-600'}`}>
                      T{machine.terminal}
                      </p>
                  </div>

                  <p><strong>Cidade:</strong> {machine.cidade}</p>
                  <p><strong>Status:</strong> {machine.status}</p>
                  <p><strong>IP:</strong> {machine.ip}</p>
                  <p><strong>Última Data On:</strong> {formatDate(machine.ultimaDataOn)}</p> {/* Formatação da data */}
                  <p><strong>SO:</strong> {machine.osVersion}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => openModal(machine, 'printers')}
                    className="text-blue-900 text-4xl rounded"
                  >
                    <MdOutlineLocalPrintshop />
                  </button>
                  <button
                    onClick={() => openModal(machine, 'software')}
                    className="text-green-900 text-4xl rounded"
                  >
                    <SiPaloaltosoftware />
                  </button>
                  <button
                    onClick={() => openModal(machine, 'network')}
                    className="text-yellow-900 text-4xl rounded"
                  >
                    <FaNetworkWired />
                  </button>
                  <button
                    onClick={() => openModal(machine, 'hardware')}
                    className="text-purple-900 text-4xl rounded"
                  >
                    <IoHardwareChipOutline />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MyModal para impressoras */}
      <MyModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Impressoras</h2>
        <ul>
          {selectedMachine && selectedMachine.printers && selectedMachine.printers.map((printer, index) => (
            <li key={index}>{printer}</li>
          ))}
        </ul>
      </MyModal>

      {/* MyModal para software */}
      <MyModal isOpen={isSoftwareModalOpen} onClose={() => setIsSoftwareModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Softwares Instalados</h2>
        <ul>
          {selectedMachine && selectedMachine.software && selectedMachine.software.map((soft, index) => (
            <li key={index}>{soft}</li>
          ))}
        </ul>
      </MyModal>

      {/* MyModal para rede */}
      <MyModal isOpen={isNetworkModalOpen} onClose={() => setIsNetworkModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Informações de Rede</h2>
        <ul>
          {selectedMachine && selectedMachine.network && selectedMachine.network.map((net, index) => (
            <li key={index}>
              <strong>Interface:</strong> {net.iface}<br />
              <strong>IP:</strong> {net.ip4}<br />
              <strong>MAC:</strong> {net.mac}<br />
              <strong>DHCP:</strong> {net.dhcp ? 'Sim' : 'Não'}<br />
              <hr className="my-2" />
            </li>
          ))}
        </ul>
      </MyModal>

      {/* MyModal para hardware */}
      <MyModal isOpen={isHardwareModalOpen} onClose={() => setIsHardwareModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Informações de Hardware</h2>
        <p><strong>CPU:</strong> {selectedMachine && selectedMachine.cpu}</p>
        <p><strong>RAM:</strong> {selectedMachine && selectedMachine.ram}</p>
        <p><strong>Placa Mãe:</strong> {selectedMachine && selectedMachine.motherboard}</p>
        <p><strong>Armazenamento:</strong> {selectedMachine && selectedMachine.storage}</p>
      </MyModal>
    </div>
  );
};

export default MonitorMaquinas;
