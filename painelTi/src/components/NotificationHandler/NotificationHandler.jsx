import React, { useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const NotificationHandler = ({ user, message, onSent }) => {
  const hasSentRef = useRef(false);

  const sendNotification = async (token, notification) => {
    try {
      await fetch('https://8404-170-233-64-252.ngrok-free.app/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokens: [token], notification })
      });
      console.log('Notificação enviada com sucesso.');
      onSent(); // Notifica o componente pai que a notificação foi enviada
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const fetchUserTokenAndSendNotification = async () => {
    try {
      const userDocRef = doc(db, 'usuarios', user.cidade);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()[user.user];
        if (userData && userData.token) {
          await sendNotification(userData.token, message);
          hasSentRef.current = true;
        } else {
          console.error('Token do usuário não encontrado.');
        }
      } else {
        console.error('Documento do usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar token do usuário:', error);
    }
  };

  useEffect(() => {
    console.log('useEffect executado. User:', user, 'Message:', message, 'HasSent:', hasSentRef.current);
    if (user && message && !hasSentRef.current) {
      fetchUserTokenAndSendNotification();
    }
  }, [user, message]);

  return null;
};

export default NotificationHandler;
