import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Ajuste o caminho conforme necessário
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho conforme necessário
import MyModal from '../Modal/MyModal'; // Certifique-se de ajustar o caminho
import { MdDeleteForever } from "react-icons/md";
import { PiEyesFill } from "react-icons/pi";
import { FaToggleOff, FaToggleOn } from "react-icons/fa6";
import { IoNotifications, IoNotificationsOffSharp } from "react-icons/io5";

const UserNotifications = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        const notificationsCollection = collection(db, 'ordersControl', 'avisos', 'docs');
        const q = query(notificationsCollection, where('createUser', '==', currentUser.user));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userNotifications = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.display !== 'hidden') {
                    userNotifications.push({ id: doc.id, ...data });
                }
            });

            setNotifications(userNotifications);
        });

        // Limpa o ouvinte quando o componente é desmontado
        return () => unsubscribe();
    }, [currentUser]);

    const handleStatusToggle = async (id, currentStatus) => {
        const notificationRef = doc(db, 'ordersControl', 'avisos', 'docs', id);
        await updateDoc(notificationRef, {
            status: currentStatus === 'on' ? 'off' : 'on',
        });
    };

    const handleOpenConfirmModal = (notification) => {
        setSelectedNotification(notification);
        setIsModalOpen(true);
    };

    const handleDeleteNotification = async (id) => {
        const notificationRef = doc(db, 'ordersControl', 'avisos', 'docs', id);
        await updateDoc(notificationRef, {
            display: 'hidden',
        });
    };

    return (
        <div className="lg:max-w-lg mx-auto p-4 bg-primaryBlueDark !h-full min-w-[370px] lg:-mt-6 rounded-b-xl shadow-lg ">
            <h2 className="text-2xl font-bold mb-4 text-white">Meus Alertas</h2>
            <div className="max-h-[480px] overflow-y-auto pr-2 ">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div key={notification.id} className="mb-4 p-4 border rounded shadow-sm bg-gray-50">
                            <div className='flex justify-between'>
                                <button
                                    onClick={() => handleStatusToggle(notification.id, notification.status)}
                                    className=" text-white rounded focus:outline-none"
                                >
                                    {notification.status === 'on' ? (
                                        <FaToggleOn className="text-green-500 text-3xl" />
                                    ) : (
                                        <FaToggleOff className="text-secRed text-3xl" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    className="  "
                                >
                                    <MdDeleteForever className='text-secRed text-3xl hover:scale-[1.1]' />
                                </button>

                            </div>
                            <h3 className="text-center text-xl font-semibold">{notification.title}</h3>
                            <div className="max-w-[330px] break-words whitespace-normal" dangerouslySetInnerHTML={{ __html: notification.message }} />
                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={() => handleOpenConfirmModal(notification)}
                                    className=" "
                                >
                                    <PiEyesFill className="text-altBlue text-3xl hover:transform hover:scale-x-[-1]" />
                                </button>


                                <span className={`text-sm font-semibold ${notification.status === 'on' ? 'text-green-600' : 'text-red-600'}`}>
                                    {notification.status === 'on' ? (
                                        <IoNotifications className="text-green-500 text-3xl" />
                                    ) : (
                                        <IoNotificationsOffSharp className="text-secRed text-3xl" />
                                    )}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Você ainda não criou nenhuma notificação.</p>
                )}
            </div>




            {/* Modal para exibir os confirmados */}
            {isModalOpen && selectedNotification && (
                <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="p-4">
                        <h3 className="text-lg font-bold mb-2">Usuários que Visualizou.</h3>
                        <ul className="list-disc list-inside">
                            {selectedNotification.confirm.length > 0 ? (
                                selectedNotification.confirm.map((user, index) => (
                                    <li key={index} className="text-sm text-gray-700">{user}</li>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Nenhum usuário visualizou ainda.</p>
                            )}
                        </ul>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="mt-4 px-4 py-2 bg-primaryBlueDark text-white rounded hover:bg-primary"
                        >
                            Fechar
                        </button>
                    </div>
                </MyModal>
            )}
        </div>
    );
};

export default UserNotifications;
