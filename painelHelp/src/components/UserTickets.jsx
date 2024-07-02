import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NewTicketModal from './NewTicketModal';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusClass = (status) => {
    switch (status) {
      case 'aberto':
        return 'text-red-700';
      case 'andamento':
        return 'text-yellow-700';
      case 'finalizado':
        return 'text-green-700';
      default:
        return 'text-gray-700';
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
        <p>Nenhum chamado aberto encontrado.</p>
      ) : (
        <ul>
          {tickets.map(ticket => (
            <li key={ticket.id} className="bg-slate-400 shadow-xl mb-4 p-4 border rounded">
              <h3 className="text-xl uppercase text-center font-semibold">{ticket.order}</h3>
              <div className='flex gap-4'>
                <p className='flex uppercase items-center'><FaCity />: {ticket.cidade}</p>
                <p className='flex uppercase items-center'><FaUser />: {ticket.user}</p>
              </div>
              <div className='flex lg:flex-row flex-col lg:gap-4'>
                <p className='flex uppercase items-center'><FaStoreAlt />: {ticket.loja}</p>
                <p><strong>Data:</strong> {ticket.data.toLocaleString()}</p>
              </div>
              <p className="flex items-center">
                <strong>Status:</strong>
                <p className={`ml-1 font-bold uppercase ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </p>
              </p>
              <p className='bg-red-100 p-3 rounded-md mb-2'><strong>Descrição:</strong> {ticket.descricao}</p>
              <p className='bg-green-100 p-3 rounded-md'><strong>Tentativa:</strong> {ticket.tentou}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserTickets;
