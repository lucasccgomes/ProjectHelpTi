import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal'; // Certifique-se de ajustar o caminho do import conforme necessário
import { db } from '../../firebase'; // Ajuste o caminho conforme necessário
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho conforme necessário

const NotificationModals = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const avisosRef = collection(db, 'ordersControl', 'avisos', 'docs');
    const q = query(avisosRef, where('status', '==', 'on'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.users.includes(currentUser.user) || data.users.includes('Todos')) {
          newNotifications.push({
            id: doc.id,
            message: data.message,
            title: data.title,
            users: data.users.join(', '),
            confirm: data.confirm || [],
            allUsers: data.users.includes('Todos'),
            usersDelet: data.usersDelet || [],
            isOpen: true, // Adiciona estado de abertura do modal para cada notificação
          });
        }
      });
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleConfirm = async (notificationId, allUsers) => {
    const notificationDoc = doc(db, 'ordersControl', 'avisos', 'docs', notificationId);

    if (allUsers) {
      await updateDoc(notificationDoc, {
        confirm: arrayUnion(currentUser.user),
        usersDelet: arrayUnion(currentUser.user),
      });
    } else {
      await updateDoc(notificationDoc, {
        confirm: arrayUnion(currentUser.user),
        status: 'off',
      });
    }
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isOpen: false } : notification
      )
    );
  };

  const shouldShowNotification = (notification) => {
    if (notification.allUsers) {
      return !notification.usersDelet.includes(currentUser.user);
    }
    return !notification.confirm.includes(currentUser.user);
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
          <div className="mb-4">
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
