import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal'; // Certifique-se de ajustar o caminho do import conforme necessário
import { db } from '../../firebase'; // Ajuste o caminho conforme necessário
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho conforme necessário

const NotificationModal = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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
          });
        }
      });
      setNotifications(newNotifications);
      setIsOpen(newNotifications.filter(shouldShowNotification).length > 0);
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
      prevNotifications.filter((notification) => notification.id !== notificationId)
    );
    setIsOpen(false);
  };

  const shouldShowNotification = (notification) => {
    if (notification.allUsers) {
      return !notification.usersDelet.includes(currentUser.user);
    }
    return !notification.confirm.includes(currentUser.user);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      {notifications.filter(shouldShowNotification).map((notification) => (
        <div key={notification.id} className="mb-4">
          <h2 className="text-2xl font-bold mb-2">{notification.title}</h2>
          <p className="mb-2">{notification.message}</p>
          <p className="text-sm text-gray-600">{`Usuário(s): ${notification.users}`}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={() => handleConfirm(notification.id, notification.allUsers)}
          >
            Ok
          </button>
        </div>
      ))}
    </Modal>
  );
};

export default NotificationModal;