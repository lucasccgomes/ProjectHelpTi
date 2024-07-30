import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from '../components/NewTicketModal/NewTicketModal';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";
import { MdReportProblem, MdHelp } from "react-icons/md";
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showArrows, setShowArrows] = useState(false);

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
    const fetchTickets = () => {
      let abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
      let q = query(abertoRef, where('user', '==', currentUser.user));

      if (statusFilter !== 'Todos') {
        q = query(abertoRef, where('user', '==', currentUser.user), where('status', '==', statusFilter));
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
      }, (error) => {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    if (currentUser.user) {
      fetchTickets();
    }
  }, [currentUser.user, statusFilter]);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 w-full pt-20 flex flex-col justify-center items-center text-gray-700">
      <div className='flex flex-col lg:flex-row gap-4'>
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Meus Chamados</h2>
        <button
          className="mb-4 bg-primary flex justify-center items-center hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          <MdHelp className='text-xl mr-1' /> Novo Chamado
        </button>
        <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addTicket={addTicket} />
      </div>

      <div className="flex-row w-full mb-8">
        <p className='-mb-2'>
          Filtrar
        </p>
        <Dropdown
          label=""
          options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM']}
          selected={statusFilter}
          onSelectedChange={(option) => setStatusFilter(option)}
        />
      </div>
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
                <div className="bg-primary text-white shadow lg:min-w-[250px] mb-4 p-4 border-2 rounded-xl">
                  <div className="text-xl text-gray-700 bg-white font-bold uppercase rounded-b-xl -mt-5 mb-2 pb-1 text-center">
                    {ticket.order}
                  </div>
                  <p className={`my-1 p-1 rounded-lg text-white uppercase shadow-xl ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </p>

                  <div className='flex gap-4 mb-1'>
                    <p className='flex uppercase items-center'><FaCity />: {ticket.cidade}</p>
                    <p className='flex uppercase items-center'><FaUser />: {ticket.user}</p>
                  </div>

                  <div className='flex gap-4 mb-1'>
                    <p className='flex uppercase items-center'><FaStoreAlt />: {ticket.loja}</p>
                    <p className='flex uppercase items-center'>
                      <MdReportProblem />: {ticket.localProblema}
                    </p>
                  </div>

                  <div className='flex gap-4 mb-1'>
                    <p>
                      <strong>
                        Data:
                      </strong>
                      {ticket.data.toLocaleString()}
                    </p>
                  </div>
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md mb-2 shadow-lg'>
                    <p className='text-center font-bold'>Descrição</p>
                    <p className=' overflow-y-auto break-words max-h-14 min-h-14' >{ticket.descricao}</p>
                  </div>
                  <div className='bg-white text-gray-700 pt-0 px-2 pb-1 rounded-md shadow-lg'>
                    <p className='text-center font-bold'>Tentativa</p>
                    <p className=' overflow-y-auto break-words max-h-14 min-h-14' >{ticket.tentou}</p>
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
