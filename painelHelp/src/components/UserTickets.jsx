import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from './NewTicketModal';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";
import { MdReportProblem, MdHelp } from "react-icons/md";
import { useSwipeable } from 'react-swipeable';
import { GrCaretPrevious, GrCaretNext } from "react-icons/gr";

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [statusFilter, setStatusFilter] = useState('aberto');

  const getStatusClass = (status) => {
    switch (status) {
      case 'aberto':
        return 'bg-red-600';
      case 'andamento':
        return 'bg-orange-600';
      case 'finalizado':
        return 'bg-green-600';
      default:
        return 'bg-gray-700';
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        let abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
        let q = query(abertoRef, where('user', '==', currentUser));

        if (statusFilter !== 'todos') {
          q = query(abertoRef, where('user', '==', currentUser), where('status', '==', statusFilter));
        }

        const querySnapshot = await getDocs(q);

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
      } catch (error) {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser, statusFilter]);

  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth >= 1280) {
        setItemsPerSlide(3);
      } else if (window.innerWidth >= 1023) {
        setItemsPerSlide(3);
      } else {
        setItemsPerSlide(1);
      }
    };

    window.addEventListener('resize', updateItemsPerSlide);
    updateItemsPerSlide();

    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, []);

  const addTicket = (ticket) => {
    setTickets((prevTickets) => [ticket, ...prevTickets]);
  };

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? Math.ceil(tickets.length / itemsPerSlide) - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === Math.ceil(tickets.length / itemsPerSlide) - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 w-screen flex flex-col justify-center items-center">
      <div className='flex flex-col lg:flex-row gap-4'>
        <h2 className="text-2xl font-bold mb-4">Meus Chamados</h2>
        <button
          className="mb-4 bg-primary flex justify-center items-center hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          <MdHelp className='text-xl mr-1' /> Novo Chamado
        </button>
        <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addTicket={addTicket} />
      </div>

      <div className="mb-4">
        <label htmlFor="statusFilter" className="mr-2 font-bold">Filtrar por status:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="todos">Todos</option>
          <option value="aberto">Aberto</option>
          <option value="andamento">Andamento</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <p>Nenhum chamado em seu nome.</p>
      ) : (
        <div className="relative  max-w-full" {...handlers}>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * 100 / itemsPerSlide}%)` }}>
              {tickets.map(ticket => (
                <div key={ticket.id} className='gap-4' style={{ flex: `0 0 ${100 / itemsPerSlide}%` }}>
                  <div className="bg-gray-400 shadow-xl lg:min-w-[250px] mb-4 p-4 border-2 rounded">
                    <h3 className="text-xl uppercase text-center font-semibold">
                      {ticket.order}
                      <p className={`my-1 p-1 rounded-lg text-white uppercase ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                      </p>
                    </h3>

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

                    <div className='bg-white p-3 rounded-md max-h-20 overflow-y-auto mb-2 mt-2'>
                      <p className='text-center font-bold'>Descrição</p>
                      <p>{ticket.descricao}</p>
                    </div>

                    <div className='bg-white p-3 rounded-md max-h-20 overflow-y-auto mb-2 mt-2'>
                      <p className='text-center font-bold'>Tentativa</p>
                      <p>{ticket.tentou}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={goToPrevious} className="absolute top-1/2 left-5 transform -translate-y-1/2 bg-primary text-white p-3 rounded opacity-85"><GrCaretPrevious /></button>
          <button onClick={goToNext} className="absolute top-1/2 right-5 transform -translate-y-1/2 bg-primary text-white p-3 rounded opacity-85"><GrCaretNext /></button>
        </div>
      )}
    </div>
  );
};

export default UserTickets;
