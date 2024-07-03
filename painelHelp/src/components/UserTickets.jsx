import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from './NewTicketModal';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";
import { MdReportProblem } from "react-icons/md"
const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        console.log('Procurando chamados para o usuário:', currentUser);

        const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
        const q = query(abertoRef, where('user', '==', currentUser));

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
  }, [currentUser]);

  const addTicket = (ticket) => {
    setTickets((prevTickets) => [ticket, ...prevTickets]);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className='flex gap-4'>
        <h2 className="text-2xl font-bold mb-4">Meus Chamados</h2>
        <button
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          Novo Chamado
        </button>
        <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addTicket={addTicket} />
      </div>
      {tickets.length === 0 ? (
        <p>Nenhum chamado em seu nome.</p>
      ) : (
        <ul className='max-w-[500px]'>
          {tickets.map(ticket => (
            <li key={ticket.id} className="bg-slate-400 shadow-xl mb-4 p-4 border rounded">
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

              <div className='bg-white p-3 rounded-md mb-2 mt-2'>
                <p className='text-center font-bold'>Descrição</p>
                <p>{ticket.descricao}</p>
              </div>

              <div className='bg-white p-3 rounded-md mb-2 mt-2'>
                <p className='text-center font-bold'>Tentativa</p>
                <p>{ticket.tentou}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserTickets;
