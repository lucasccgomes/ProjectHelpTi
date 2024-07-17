import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const currentPermission = Notification.permission;
    if (currentPermission === 'granted') {
      console.log('Permissão de notificação já concedida');
      return true;
    } else if (currentPermission === 'denied') {
      console.error('Permissão de notificação foi negada anteriormente');
      return false;
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Permissão de notificação concedida');
        return true;
      } else {
        console.error('Permissão de notificação negada');
        return false;
      }
    }
  } else {
    console.error('Notificações não são suportadas neste navegador');
    return false;
  }
};

export const checkForNewTickets = async (lastNotifiedTicketDate, lastNotifiedTicketOrder) => {
  try {
    console.log('Verificando novos tickets...');
    const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
    const q = query(abertoRef, orderBy('data', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('Nenhum ticket encontrado.');
      return null;
    }

    const latestDoc = querySnapshot.docs[0];
    const latestTicketData = latestDoc.data();

    const latestTicketDate = latestTicketData.data.toDate();
    const latestTicketOrder = latestTicketData.order;

    console.log('Último ticket notificado:', lastNotifiedTicketOrder, lastNotifiedTicketDate);
    console.log('Ticket mais recente:', latestTicketOrder, latestTicketDate);

    if (!lastNotifiedTicketDate || latestTicketDate > new Date(lastNotifiedTicketDate) || latestTicketOrder !== lastNotifiedTicketOrder) {
      console.log('Novo ticket encontrado:', latestTicketData);

      if (Notification.permission === 'granted') {
        const notification = new Notification('Novo Chamado', {
          body: `Um novo chamado foi registrado: ${latestTicketData.order}`,
        });
        notification.onclick = () => {
          window.focus();
        };
        console.log('Notificação enviada:', notification);

        // Atualizar localStorage
        localStorage.setItem('lastNotifiedTicketDate', latestTicketDate.toISOString());
        localStorage.setItem('lastNotifiedTicketOrder', latestTicketOrder);
        
        console.log('LocalStorage atualizado: ', {
          lastNotifiedTicketDate: latestTicketDate.toISOString(),
          lastNotifiedTicketOrder: latestTicketOrder,
        });

        // Retorne a data/hora e a ordem do último ticket notificado
        return { date: latestTicketDate, order: latestTicketOrder };
      } else {
        console.error('Permissão de notificação não concedida no momento de envio');
      }
    } else {
      console.log('Nenhum novo ticket encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
  }

  return null;
};
