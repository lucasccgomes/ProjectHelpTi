import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from '../components/NewTicketModal/NewTicketModal';
import { FaCity, FaUser, FaStoreAlt, FaFilter } from "react-icons/fa";
import { IoCalendarNumber } from "react-icons/io5";
import { MdReportProblem, MdHelp, MdToggleOff, MdToggleOn } from "react-icons/md";
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import Modal from '../components/Modal/Modal';
import { useSpring, animated } from '@react-spring/web';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [cityFilter, setCityFilter] = useState('Todas');
  const [storeFilter, setStoreFilter] = useState('Todas');
  const [userFilter, setUserFilter] = useState('Todos');
  const [showArrows, setShowArrows] = useState(false);
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [showStoreTickets, setShowStoreTickets] = useState(false);

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

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            data: data.data.toDate()
          };
        });

        setTickets(ticketsData);
        setLoading(false);
        console.log("Fetched tickets:", ticketsData);
      }, (error) => {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    if (currentUser.user) {
      fetchTickets();
    }
  }, [currentUser, statusFilter, cityFilter, storeFilter, userFilter, showStoreTickets]);

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

  const addTicket = (ticket) => {
    setTickets((prevTickets) => {
      const isTicketAlreadyAdded = prevTickets.some(prevTicket => prevTicket.id === ticket.id);
      if (!isTicketAlreadyAdded) {
        return [ticket, ...prevTickets];
      }
      return prevTickets;
    });
  };

  const toggleSpring = useSpring({
    config: { tension: 100, friction: 52 },
  });

  if (loading) {
    return <div><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 w-full pt-12 flex lg:pt-20 flex-col justify-center items-center text-gray-700">
      {currentUser.cargo !== 'Supervisor' && (
        <div className='w-full flex'>
          <div className='flex items-center px-1 text-white rounded-b-xl bg-primaryBlueDark lg:hidden'>
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

        <h2 className="text-2xl w-full font-bold text-center lg:text-end text-gray-700">Meus Chamados</h2>
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

      <div className="hidden bg-primaryBlueDark p-3 rounded-xl text-white lg:flex flex-row w-full mb-8 justify-center items-center text-center gap-4">
        <div className='flex justify-center items-center'>

        </div>
        <div className='flex justify-center items-center flex-col min-w-28'>
          <p className='text-center -mb-2 ml-4'>
            Status
          </p>
          <div className='flex justify-center items-center gap-2'>
            <FaFilter />
            <Dropdown
              label=""
              options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM']}
              selected={statusFilter}
              onSelectedChange={(option) => setStatusFilter(option)}
            />
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
                onSelectedChange={(option) => setCityFilter(option)}
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
                onSelectedChange={(option) => setStoreFilter(option)}
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
                onSelectedChange={(option) => setUserFilter(option)}
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
                onSelectedChange={(option) => setCityFilter(option)}
              />

              <p className='-mb-2'>
                Filtrar por Loja
              </p>
              <Dropdown
                label=""
                options={['Todas', ...stores]}
                selected={storeFilter}
                onSelectedChange={(option) => setStoreFilter(option)}
              />

              <p className='-mb-2'>
                Filtrar por Usuário
              </p>
              <Dropdown
                label=""
                options={['Todos', ...users]}
                selected={userFilter}
                onSelectedChange={(option) => setUserFilter(option)}
              />
            </>
          )}
          <p className='-mb-2'>
            Filtrar por Status
          </p>
          <Dropdown
            label=""
            options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM']}
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

      {tickets.length === 0 ? (
        <p>Nenhum chamado em seu nome.</p>
      ) : (
        <div
          className="relative w-full"
          onMouseEnter={() => setShowArrows(true)}
          onMouseLeave={() => setShowArrows(false)}
        >
          <Carousel
            showArrows={showArrows}
            showStatus={false}
            showIndicators={false}
            showThumbs={false}
            useKeyboardArrows
            swipeable
            centerMode
            centerSlidePercentage={slidesToShow === 1 ? 100 : 33.33}
          >
            {tickets.map(ticket => (
              <div key={ticket.id} className='gap-4'>
                <div className="bg-primaryBlueDark text-white shadow lg:min-w-[250px] mb-4 p-4 border-2 rounded-xl">
                  <div className="text-xl text-gray-700 bg-white font-bold uppercase rounded-b-xl -mt-5 mb-2 pb-1 text-center">
                    {ticket.order}
                  </div>
                  <p className={`my-1 p-1 rounded-lg text-white uppercase shadow-xl ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </p>

                  <div className='flex gap-4 mb-1'>
                    <p className='flex uppercase items-center'><FaCity />: {ticket.cidade === 'Presidente Prudente' ? 'P. Prudente' : ticket.cidade}</p>
                    <p className='flex uppercase items-center'><FaUser />: {ticket.user}</p>
                  </div>

                  <div className='flex gap-4 mb-1'>
                    <p className='flex uppercase items-center'><FaStoreAlt />: {ticket.loja}</p>
                    <p className='flex uppercase items-center'>
                      <MdReportProblem />: {ticket.localProblema}
                    </p>
                  </div>

                  <div className='flex gap-4 mb-1'>
                    <p className='flex justify-center items-center'>
                      <IoCalendarNumber />: {ticket.data.toLocaleString()}
                    </p>
                  </div>
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md mb-2 shadow-lg'>
                    <p className='text-center font-bold'>Descrição</p>
                    <p className=' overflow-y-auto break-words max-h-14 min-h-14' >{ticket.descricao}</p>
                  </div>
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md shadow-lg'>
                    <p className='text-center font-bold'>
                      {ticket.status === 'Andamento' ? 'Tratativa' : 'Tentativa'}
                    </p>
                    <p className='overflow-y-auto break-words max-h-14 min-h-14'>
                      {ticket.status === 'Andamento' ? ticket.treatment : ticket.tentou}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      )}
      <NotificationModal />
    </div>
  );
};

export default UserTickets;
