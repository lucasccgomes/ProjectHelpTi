import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        console.log('Procurando chamados para o usuário:', currentUser);

        // Correção da referência da coleção
        const abertoRef = collection(db, 'chamados', 'aberto', 'tickets'); // Ajuste para acessar a subcoleção corretamente

        // Log da query
        console.log('Criando query para buscar chamados do usuário:', currentUser);
        const q = query(abertoRef, where('user', '==', currentUser));

        // Log antes de buscar os documentos
        console.log('Executando a query...');
        const querySnapshot = await getDocs(q);

        console.log('Query executada, processando resultados...');
        const ticketsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            data: data.data.toDate() // Convertendo o Timestamp para Date
          };
        });

        console.log('Chamados encontrados:', ticketsData);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Meus Chamados Abertos</h2>
      {tickets.length === 0 ? (
        <p>Nenhum chamado aberto encontrado.</p>
      ) : (
        <ul>
          {tickets.map(ticket => (
            <li key={ticket.id} className="mb-2 p-4 border rounded">
              <h3 className="text-xl font-semibold">{ticket.order}</h3>
              <p><strong>Cidade:</strong> {ticket.cidade}</p>
              <p><strong>Data:</strong> {ticket.data.toLocaleString()}</p>
              <p><strong>Status:</strong> {ticket.status}</p>
              <p><strong>Descrição:</strong> {ticket.descricao}</p>
              <p><strong>Observação:</strong> {ticket.tentou}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserTickets;
