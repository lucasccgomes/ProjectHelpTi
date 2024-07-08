import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Permissão de notificação negada');
    } else {
      console.log('Permissão de notificação concedida');
    }
  }
};

export const checkForNewTickets = async (tickets) => {
  try {
    console.log('Verificando novos tickets...');
    const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
    const q = query(abertoRef, orderBy('data', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    const latestDoc = querySnapshot.docs[0];
    const latestTicketData = latestDoc.data();

    const latestTicketDate = latestTicketData.data.toDate();

    if (tickets.length === 0 || latestTicketDate > tickets[0].data) {
      new Notification('Novo Chamado', {
        body: `Um novo chamado foi registrado: ${latestTicketData.order}`,
      });
      console.log('Novo ticket encontrado:', latestTicketData);
    } else {
      console.log('Nenhum novo ticket encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
  }
};
