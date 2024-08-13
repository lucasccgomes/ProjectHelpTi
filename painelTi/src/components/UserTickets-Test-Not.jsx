import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationProvider, useNotification } from '../context/NotificationContext';
import NotificationHandler from './NotificationHandler/NotificationHandler';

const UserTickets = () => {
  return (
    <NotificationProvider>
      <NotificationApp />
    </NotificationProvider>
  );
};

const NotificationApp = () => {
  const [notificationData, setNotificationData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { markAsSent, hasBeenSent } = useNotification();

  const handleSendNotification = async () => {
    console.log('Botão de envio de notificação clicado.');
    const user = { user: 'UsuarioDeTeste01', cidade: 'Osvaldo Cruz' };
    const message = {
      notification: {
        title: '',
        body: '',
        click_action: "https://admhelpti.netlify.app/",
        icon: "https://iili.io/duTTt8Q.png"
      }
    };

    if (hasBeenSent(message.notification.title)) {
      console.log('Notificação já enviada. Saindo da função.');
      return;
    }

    setNotificationData({ user, message });
    setIsSending(true);

    console.log('Buscando token do usuário...');
    try {
      const userDocRef = doc(db, 'usuarios', user.cidade);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()[user.user];
        console.log('Dados do usuário:', userData);
        if (userData && userData.token) {
          console.log('Token do usuário encontrado:', userData.token);
          const response = await fetch('https://8bef-2804-1784-30b3-6700-a555-89b1-9fd5-7d87.ngrok-free.app/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tokens: [userData.token], notification: message.notification })
          });
          const result = await response.json();
          console.log('Resposta do servidor:', result);
          console.log('Notificação enviada com sucesso.');
          markAsSent(message.notification.title);
        } else {
          console.error('Token do usuário não encontrado.');
        }
      } else {
        console.error('Documento do usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar token do usuário ou enviar notificação:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 w-full flex flex-col justify-center items-center">
      <button
        onClick={handleSendNotification}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Enviar Notificação de Teste
      </button>
      {notificationData && (
        <NotificationHandler
          user={notificationData.user}
          message={notificationData.message}
          isSending={isSending}
          onSent={() => {
            console.log(`Notificação enviada para o ticket ${notificationData.message.notification.title}`);
            setNotificationData(null);
          }}
        />
      )}
    </div>
  );
};

export default UserTickets;
