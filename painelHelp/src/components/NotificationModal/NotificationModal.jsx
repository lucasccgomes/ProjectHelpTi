import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const NotificationModals = () => {
  const { currentUser } = useAuth(); // Obtém o usuário autenticado atual
  const [notifications, setNotifications] = useState([]); // Estado para armazenar as notificações

  useEffect(() => {
    const avisosRef = collection(db, 'ordersControl', 'avisos', 'docs'); // Referência à coleção de avisos no Firestore
    const q = query(avisosRef, where('status', '==', 'on')); // Cria uma query para buscar avisos com status "on"

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = []; // Array para armazenar as novas notificações
      snapshot.forEach((doc) => {
        const data = doc.data(); // Obtém os dados de cada documento
        if (data.users.includes(currentUser.user) || data.users.includes('Todos')) { // Verifica se o usuário deve receber a notificação
          newNotifications.push({
            id: doc.id, // ID da notificação
            message: data.message, // Mensagem da notificação
            title: data.title, // Título da notificação
            users: data.users.join(', '), // Usuários que recebem a notificação
            confirm: data.confirm || [], // Lista de usuários que confirmaram a notificação
            allUsers: data.users.includes('Todos'), // Verifica se a notificação é para todos os usuários
            usersDelet: data.usersDelet || [], // Lista de usuários que deletaram a notificação
            isOpen: true, // Estado de abertura do modal para cada notificação
          });
        }
      });
      setNotifications(newNotifications); // Atualiza o estado com as novas notificações
    });

    return () => unsubscribe(); // Limpa a assinatura do snapshot ao desmontar o componente
  }, [currentUser]);

  const handleConfirm = async (notificationId, allUsers) => {
    const notificationDoc = doc(db, 'ordersControl', 'avisos', 'docs', notificationId); // Referência ao documento da notificação no Firestore

    if (allUsers) {
      await updateDoc(notificationDoc, {
        confirm: arrayUnion(currentUser.user), // Adiciona o usuário à lista de confirmações
        usersDelet: arrayUnion(currentUser.user), // Adiciona o usuário à lista de deletados
      });
    } else {
      await updateDoc(notificationDoc, {
        confirm: arrayUnion(currentUser.user), // Adiciona o usuário à lista de confirmações
        status: 'off', // Define o status da notificação como "off"
      });
    }
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isOpen: false } : notification // Fecha o modal da notificação confirmada
      )
    );
  };

  const shouldShowNotification = (notification) => {
    if (notification.allUsers) {
      return !notification.usersDelet.includes(currentUser.user); // Verifica se o usuário ainda não deletou a notificação
    }
    return !notification.confirm.includes(currentUser.user); // Verifica se o usuário ainda não confirmou a notificação
  };

  return (
    <>
      {notifications.filter(shouldShowNotification).map((notification) => (
        <Modal
          key={notification.id}
          isOpen={notification.isOpen}
          onClose={() =>
            setNotifications((prevNotifications) =>
              prevNotifications.map((n) =>
                n.id === notification.id ? { ...n, isOpen: false } : n
              )
            )
          }
        >
          <div className="mb-4 !text-black">
            <h2 className="text-2xl font-bold mb-2">{notification.title}</h2>
            <div className="max-w-[330px] break-words whitespace-normal" dangerouslySetInnerHTML={{ __html: notification.message }} >
            </div>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              onClick={() => handleConfirm(notification.id, notification.allUsers)}
            >
              Ok
            </button>
          </div>
        </Modal>
      ))}
    </>
  );
};

export default NotificationModals;
