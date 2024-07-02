import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [finalizadoDescricao, setFinalizadoDescricao] = useState('');

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
        const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
        const querySnapshot = await getDocs(abertoRef);
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

    fetchTickets();
  }, []);

  const updateTicketStatus = async (id, status, descricaoFinalizacao = '') => {
    try {
      const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', id);
      await updateDoc(ticketDocRef, { status, descricaoFinalizacao });
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === id ? { ...ticket, status, descricaoFinalizacao } : ticket
        )
      );
      setSelectedTicket(null);
      setFinalizadoDescricao('');
    } catch (error) {
      console.error('Erro ao atualizar status do chamado:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    (statusFilter ? ticket.status === statusFilter : true) &&
    (userFilter ? ticket.user === userFilter : true) &&
    (storeFilter ? ticket.loja === storeFilter : true)
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  const uniqueUsers = [...new Set(tickets.map(ticket => ticket.user))];
  const uniqueStores = [...new Set(tickets.map(ticket => ticket.loja))];

  return (
    <div className="p-4 flex flex-col justify-center items-center">
      <div className='flex lg:flex-row flex-col gap-4 items-center mb-4'>
        <h2 className="text-2xl font-bold">Chamados</h2>

        <div className=''>
          <select
            className="border p-2 mr-1 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="aberto">Aberto</option>
            <option value="andamento">Andamento</option>
            <option value="finalizado">Finalizado</option>
          </select>
          <select
            className="border p-2 mr-2 rounded"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">Todos os Usuários</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <select
            className="border p-2 rounded"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="">Todas as Lojas</option>
            {uniqueStores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <p>Nenhum chamado encontrado.</p>
      ) : (
        <ul className='max-w-[500px]'>
          {filteredTickets.map(ticket => (
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
              <p className='bg-red-100 p-3 rounded-md mb-2 mt-2'><strong>Descrição:</strong> {ticket.descricao}</p>
              <p className='bg-green-100 p-3 rounded-md'><strong>Tentativa:</strong> {ticket.tentou}</p>
              {ticket.descricaoFinalizacao && (
                <p className='bg-blue-100 p-3 rounded-md mt-2'><strong>Conclusão:</strong> {ticket.descricaoFinalizacao}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => updateTicketStatus(ticket.id, 'aberto')}
                  className={`bg-red-500 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={ticket.status === 'finalizado'}
                >
                  Aberto
                </button>
                <button
                  onClick={() => updateTicketStatus(ticket.id, 'andamento')}
                  className={`bg-yellow-500 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={ticket.status === 'finalizado'}
                >
                  Andamento
                </button>
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-green-500 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={ticket.status === 'finalizado'}
                >
                  Finalizado
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            <h2 className="text-xl mb-2">Finalizar Chamado</h2>
            <textarea
              className="border p-2 w-full mb-2"
              rows="4"
              value={finalizadoDescricao}
              onChange={(e) => setFinalizadoDescricao(e.target.value)}
              placeholder="Adicione uma descrição de finalização..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  updateTicketStatus(selectedTicket.id, 'finalizado', finalizadoDescricao);
                  setSelectedTicket(null);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTickets;
