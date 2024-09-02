import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from '../components/NewTicketModal/NewTicketModal';
import { MdHelp, MdToggleOff, MdToggleOn } from "react-icons/md";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import Modal from '../components/Modal/Modal';
import { useSpring, animated } from '@react-spring/web';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { FaLocationCrosshairs } from "react-icons/fa6";
import { FaCity, FaUser, FaStoreAlt, FaCalendarCheck, FaCalendarTimes, FaFilter } from "react-icons/fa";
import { MdReportProblem, MdDoNotDisturb, MdDescription } from "react-icons/md";
import { IoIosAddCircle } from "react-icons/io";
import MyModal from '../components/MyModal/MyModal';
import { SiInstatus } from "react-icons/si";

// Componente principal que renderiza os tickets do usuário
const UserTickets = () => {
  const { currentUser } = useAuth(); // Obtém o usuário atual do contexto de autenticação
  const [tickets, setTickets] = useState([]); // Estado para armazenar os tickets
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controle do modal de novo ticket
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // Estado para controle do modal de filtros
  const [slidesToShow, setSlidesToShow] = useState(3); // Número de slides para mostrar no carrossel
  const [statusFilter, setStatusFilter] = useState('Todos'); // Filtro de status
  const [cityFilter, setCityFilter] = useState('Todas'); // Filtro de cidade
  const [storeFilter, setStoreFilter] = useState('Todas'); // Filtro de loja
  const [userFilter, setUserFilter] = useState('Todos'); // Filtro de usuário
  const [cities, setCities] = useState([]); // Estado para armazenar as cidades
  const [stores, setStores] = useState([]); // Estado para armazenar as lojas
  const [users, setUsers] = useState([]); // Estado para armazenar os usuários
  const [showStoreTickets, setShowStoreTickets] = useState(false); // Controle para exibir tickets por loja
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');

  const updateTicketToUrgent = async (ticketId, currentStatus) => {
    try {
      const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', ticketId);
      await updateDoc(ticketDocRef, {
        anteriorStatus: currentStatus, // Salva o status atual em anteriorStatus
        status: 'Urgente',
        interacao: true,
      });
      // Atualiza o estado local após a alteração
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, anteriorStatus: currentStatus, status: 'Urgente', interacao: true } : ticket
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar o ticket:', error);
    }
  };



  // Função para definir a classe CSS com base no status do ticket
  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberto':
        return 'bg-red-600';
      case 'Andamento':
        return 'bg-orange-600';
      case 'Finalizado':
        return 'bg-green-600';
      case 'VSM':
        return 'bg-blue-700';
      default:
        return 'bg-gray-700';
    }
  };

  // Hook useEffect para buscar as cidades e lojas do Firestore quando o filtro de cidade é alterado
  useEffect(() => {
    const fetchCitiesAndStores = async () => {
      const citiesDoc = await getDoc(doc(db, 'ordersControl', 'cidades'));
      if (citiesDoc.exists()) {
        const citiesData = citiesDoc.data();
        const cityNames = Object.keys(citiesData);

        setCities(cityNames);

        if (cityFilter !== 'Todas') {
          setStores(citiesData[cityFilter]);
        } else {
          const allStores = cityNames.flatMap(city => citiesData[city]);
          setStores(allStores);
        }
      }
    };

    fetchCitiesAndStores();
  }, [cityFilter]);

  // Hook useEffect para buscar os usuários que possuem tickets no Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const ticketsSnapshot = await getDocs(collection(db, 'chamados', 'aberto', 'tickets'));
      const usersSet = new Set();

      ticketsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.user) {
          usersSet.add(data.user);
        }
      });

      setUsers(Array.from(usersSet));
    };

    fetchUsers();
  }, []);

  // Hook useEffect para buscar e filtrar os tickets do Firestore com base nos filtros aplicados
  useEffect(() => {
    const fetchTickets = () => {
      let abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
      let q;

      if (currentUser.cargo === 'Supervisor') {
        q = query(abertoRef);
        if (cityFilter !== 'Todas') q = query(q, where('cidade', '==', cityFilter));
        if (storeFilter !== 'Todas') q = query(q, where('loja', '==', storeFilter));
        if (userFilter !== 'Todos') q = query(q, where('user', '==', userFilter));
        if (statusFilter !== 'Todos') q = query(q, where('status', '==', statusFilter));
        console.log("Supervisor query:", q);
      } else {
        if (showStoreTickets) {
          q = query(abertoRef, where('loja', '==', currentUser.loja));
          if (statusFilter !== 'Todos') {
            q = query(q, where('status', '==', statusFilter));
          }
          console.log("User with store tickets query:", q);
        } else {
          q = query(abertoRef, where('user', '==', currentUser.user));
          if (statusFilter !== 'Todos') {
            q = query(q, where('status', '==', statusFilter));
          }
          console.log("User tickets query:", q);
        }
      }

      // Subscrição para ouvir as atualizações dos tickets em tempo real
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            data: data.data.toDate(), // Converte 'data' para Date
            finalizadoData: data.finalizadoData ? data.finalizadoData.toDate() : null // Converte 'finalizadoData' para Date, se existir
          };
        });

        setTickets(ticketsData);
        setLoading(false);
      }, (error) => {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      });

      return () => unsubscribe(); // Cancela a subscrição quando o componente é desmontado
    };

    if (currentUser.user) {
      fetchTickets();
    }
  }, [currentUser, statusFilter, cityFilter, storeFilter, userFilter, showStoreTickets]);

  // Hook useEffect para ajustar o número de slides no carrossel com base na largura da janela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSlidesToShow(3);
      } else {
        setSlidesToShow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para adicionar um novo ticket ao estado, evitando duplicados
  const addTicket = (ticket) => {
    setTickets((prevTickets) => {
      const isTicketAlreadyAdded = prevTickets.some(prevTicket => prevTicket.id === ticket.id);
      if (!isTicketAlreadyAdded) {
        return [ticket, ...prevTickets];
      }
      return prevTickets;
    });
  };

  // Configuração para animação com react-spring
  const toggleSpring = useSpring({
    config: { tension: 100, friction: 52 },
  });

  // Renderização condicional enquanto os dados estão sendo carregados
  if (loading) {
    return <div><LoadingSpinner /></div>;
  }

  const abreviarCidade = (cidade) => {
    const palavras = cidade.split(' ');
    if (palavras.length > 1) {
      const primeiraPalavra = palavras[0].substring(0, 3); // Abrevia a primeira palavra
      const ultimaPalavra = palavras[palavras.length - 1]; // Mantém a última palavra completa
      return `${primeiraPalavra}. ${ultimaPalavra}`;
    }
    return cidade; // Se for uma única palavra, retorna sem abreviação
  };

  return (
    <div className="bg-altBlue justify-center items-center">

      <div className='w-full bg-altBlue p-4 fixed mt-[3.5rem] z-10'>
        {currentUser.cargo !== 'Supervisor' && (
          <div className='w-full flex'>
            <div className='flex items-center px-1 text-white rounded-b-xl bg-primaryBlueDark -mt-4 lg:hidden'>
              <animated.button
                style={toggleSpring}
                className={`flex items-center ${showStoreTickets ? '' : ''} hover:bg-${showStoreTickets ? 'green-500' : 'gray-500'} text-white font-bold ml-4`}
                onClick={() => setShowStoreTickets(!showStoreTickets)}
              >
                {showStoreTickets ?
                  <MdToggleOn className='text-6xl text-green-500' /> : <MdToggleOff className='text-6xl text-red-500' />}
              </animated.button>
              <p className='mr-1'> Todos da {currentUser.loja}</p>
            </div>
          </div>
        )}
        <div className='flex flex-col lg:flex-row lg:gap-4 w-full items-center mb-4 mt-4 lg:mt-0'>

          <h2 className="text-2xl w-full font-bold text-center lg:text-end text-white">Meus Chamados</h2>
          <div className="flex w-full items-center lg:justify-start justify-center gap-2">
            <button
              className=" bg-primaryBlueDark flex justify-center items-center hover:bg-secondary text-white font-bold py-2 px-4 rounded"
              onClick={() => setIsModalOpen(true)}
            >
              <MdHelp className='text-xl mr-1' /> Novo Chamado
            </button>
            <button
              className=" lg:hidden bg-primaryBlueDark flex justify-center items-center hover:bg-secondary text-white font-bold py-2 px-4 rounded"
              onClick={() => setIsFilterModalOpen(true)}
            >
              <FaFilter className='text-xl' /> Filtrar
            </button>

          </div>

          <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addTicket={addTicket} />
        </div>

        <div className="hidden bg-primaryBlueDark p-3 rounded-xl text-white lg:flex flex-row w-full  justify-center items-center text-center gap-4">
          <div className='flex justify-center items-center'>

          </div>
          <div className='flex justify-center items-center flex-col min-w-28'>
            <p className='text-center -mb-2 ml-4'>
              Status
            </p>
            <div className='flex justify-center items-center gap-2'>
              <FaFilter />
              <div className='w-32'>
                <Dropdown
                  label=""
                  options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM', 'Urgente']} // Adicione 'Urgente' aqui
                  selected={statusFilter}
                  onSelectedChange={(option) => setStatusFilter(option)}
                />
              </div>
            </div>
          </div>
          {currentUser.cargo === 'Supervisor' && (
            <>
              <div className='flex flex-col min-w-36'>
                <p className='-mb-2'>
                  Cidade
                </p>
                <Dropdown
                  label=""
                  options={['Todas', ...cities]}
                  selected={cityFilter}
                  onSelectedChange={(option) => {
                    setCityFilter(option);
                    if (option !== 'Todas') {
                      setStoreFilter('Todas');
                      setUserFilter('Todos');
                    }
                  }}
                />
              </div>
              <div className='flex flex-col min-w-28'>
                <p className='-mb-2'>
                  Loja
                </p>
                <Dropdown
                  label=""
                  options={['Todas', ...stores]}
                  selected={storeFilter}
                  onSelectedChange={(option) => {
                    setStoreFilter(option);
                    if (option !== 'Todas') {
                      setCityFilter('Todas');
                      setUserFilter('Todos');
                    }
                  }}
                />
              </div>
              <div className='flex flex-col min-w-28'>
                <p className='-mb-2'>
                  Usuário
                </p>
                <Dropdown
                  label=""
                  options={['Todos', ...users]}
                  selected={userFilter}
                  onSelectedChange={(option) => {
                    setUserFilter(option);
                    if (option !== 'Todos') {
                      setCityFilter('Todas');
                      setStoreFilter('Todas');
                    }
                  }}
                />
              </div>
            </>
          )}
          {currentUser.cargo !== 'Supervisor' && (
            <div className='flex items-center w-full justify-end'>
              Todos da {currentUser.loja}
              <animated.button
                style={toggleSpring}
                className={`flex items-center ${showStoreTickets ? '' : ''} hover:bg-${showStoreTickets ? 'green-500' : 'gray-500'} text-white font-bold `}
                onClick={() => setShowStoreTickets(!showStoreTickets)}
              >
                {showStoreTickets ?
                  <MdToggleOn className='text-6xl text-green-500' /> : <MdToggleOff className='text-6xl text-red-500' />}
              </animated.button>
            </div>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <p>Nenhum chamado em seu nome.</p>
      ) : (
        <div className="grid pt-64 grid-cols-1 p-4 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white text-white shadow-xl mb-4 px-4 rounded-xl">
              <div className='flex flex-row justify-between  rounded-lg '>
                <div className="text-xl px-2 text-white shadow-xl rounded-b-xl pb-2 bg-altBlue font-semibold uppercase  text-center">
                  {ticket.order}
                </div>
                <p className={`px-2 pb-2 text-xl font-semibold rounded-b-xl text-white uppercase shadow-xl ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </p>
              </div>

              <div className='flex justify-between gap-4 mb-1 mt-2'>
                <div className="flex">
                  <FaCity className="mr-2 text-primaryBlueDark text-xl" />
                  <p className='font-semibold text-gray-700'>
                    {abreviarCidade(ticket.cidade)}
                  </p>
                </div>
                <div className="flex">
                  <FaUser className="mr-2 text-primaryBlueDark text-xl" />
                  <p className='font-semibold text-gray-700'>
                    {ticket.user}
                  </p>
                </div>
                <div className="flex">
                  <FaStoreAlt className="mr-2 text-primaryBlueDark text-xl" />
                  <p className='font-semibold text-gray-700'>
                    {ticket.loja}
                  </p>
                </div>
              </div>


              <div className='flex justify-between my-2'>
                <div className="flex">
                  <FaCalendarTimes className="mr-2 text-primaryBlueDark text-xl" />
                  <p className='font-semibold text-gray-700'>
                    {ticket.data.toLocaleString('pt-BR')}
                  </p>
                </div>
                {ticket.finalizadoData && (
                  <div className="flex">
                    <FaCalendarCheck className="mr-2 text-primaryBlueDark text-xl" />
                    <p className='font-semibold text-gray-700'>
                      {ticket.finalizadoData.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <div className='flex justify-between bg-altBlue p-2 rounded-xl mb-2'>
                <div className='flex justify-center items-center bg-orange-100 rounded-xl px-3'>
                  <FaLocationCrosshairs className="mr-2 text-primaryBlueDark text-xl" />
                  <p className='font-semibold text-gray-700'>
                    {ticket.localProblema}
                  </p>
                </div>
                <div className='bg-orange-100 rounded-xl px-3'>
                  {ticket.checkproblema && ticket.checkproblema.length > 0 && ticket.checkproblema.some(item => item.trim() !== "") ? (
                    <ul>
                      {ticket.checkproblema.map((checkbox, index) => (
                        checkbox.trim() !== "" && ( // Adiciona esta condição para evitar a exibição de itens vazios
                          <li key={index} className='flex justify-center items-center font-bold'>
                            <MdReportProblem className="mr-2 text-primaryBlueDark text-xl" />
                            <p className='font-semibold text-gray-700'>
                              {checkbox}
                            </p>
                          </li>
                        )
                      ))}
                    </ul>
                  ) : (
                    <div className='flex justify-center items-center'>
                      <MdDoNotDisturb className="mr-2 text-primaryBlueDark text-xl" />
                      <p className='font-semibold text-gray-700'>
                        Aguardando
                      </p>
                    </div>
                  )}
                </div>

              </div>

              <div className='flex flex-col justify-between'>
                <div className='flex justify-between'>
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md mb-2 shadow-lg'>
                    <button
                      className='bg-primaryBlueDark text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                      onClick={() => {
                        setSelectedDescription(ticket.descricao);
                        setIsDescriptionModalOpen(true);
                      }}
                    >
                      <MdDescription className='mr-2' />
                      Descrição
                    </button>
                  </div>

                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md shadow-lg'>
                    <button
                      className={`bg-primaryBlueDark text-white px-4 py-2 rounded-md w-full flex justify-center items-center ${ticket.status === 'Andamento' ? 'blinking' : ''}`}
                      onClick={() => {
                        setSelectedContent(ticket.status === 'Andamento' ? ticket.treatment : ticket.tentou);
                        setContentTitle(ticket.status === 'Andamento' ? 'Andamento' : 'Tentativa');
                        setIsContentModalOpen(true);
                      }}
                    >
                      <MdDescription className='mr-2' />
                      {ticket.status === 'Andamento' ? 'Andamento' : 'Tentativa'}
                    </button>
                  </div>

                </div>

                {ticket.status !== 'Finalizado' && (
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md shadow-lg'>
                    <button
                      className='bg-red-700 text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                      onClick={() => updateTicketToUrgent(ticket.id, ticket.status)}
                    >
                      <IoIosAddCircle className='mr-2' />
                      <p>Atenção</p>
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
      <NotificationModal />
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)}>
        <div className="flex flex-col w-full mb-8">
          {currentUser.cargo === 'Supervisor' && (
            <>
              <p className='-mb-2'>
                Filtrar por Cidade
              </p>
              <Dropdown
                label=""
                options={['Todas', ...cities]}
                selected={cityFilter}
                onSelectedChange={(option) => {
                  setCityFilter(option);
                  if (option !== 'Todas') {
                    setStoreFilter('Todas');
                    setUserFilter('Todos');
                  }
                }}
              />

              <p className='-mb-2'>
                Filtrar por Loja
              </p>
              <Dropdown
                label=""
                options={['Todas', ...stores]}
                selected={storeFilter}
                onSelectedChange={(option) => {
                  setStoreFilter(option);
                  if (option !== 'Todas') {
                    setCityFilter('Todas');
                    setUserFilter('Todos');
                  }
                }}
              />

              <p className='-mb-2'>
                Filtrar por Usuário
              </p>
              <Dropdown
                label=""
                options={['Todos', ...users]}
                selected={userFilter}
                onSelectedChange={(option) => {
                  setUserFilter(option);
                  if (option !== 'Todos') {
                    setCityFilter('Todas');
                    setStoreFilter('Todas');
                  }
                }}
              />
            </>
          )}
          <p className='-mb-2'>
            Filtrar por Status
          </p>
          <Dropdown
            label=""
            options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM', 'Urgente']} // Adicione 'Urgente' aqui
            selected={statusFilter}
            onSelectedChange={(option) => setStatusFilter(option)}
          />
        </div>
        <button
          className="bg-primaryBlueDark flex justify-center items-center hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsFilterModalOpen(false)}
        >
          Filtrar
        </button>
      </Modal>
      <MyModal isOpen={isContentModalOpen} onClose={() => setIsContentModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">{contentTitle}</h2>
        <div
          className="overflow-y-auto break-words"
          dangerouslySetInnerHTML={{ __html: selectedContent }}
        ></div>
      </MyModal>
      <MyModal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Descrição</h2>
        <div
          className="overflow-y-auto break-words"
          dangerouslySetInnerHTML={{ __html: selectedDescription }}
        ></div>
      </MyModal>

    </div>
  );
};

export default UserTickets;
