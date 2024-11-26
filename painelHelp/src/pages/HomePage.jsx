import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAuth } from '../context/AuthContext';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import LastUserTicket from '../components/LastUserTicket/LastUserTicket';
import LastSolicitacao from '../components/LastSolicitacao/LastSolicitacao';
import LastSolicitCompras from '../components/LastSolicitCompras/LastSolicitCompras';
import FullNameModal from '../components/FullNameModal/FullNameModal';
import MyModal from '../components/MyModal/MyModal';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { FiSun, FiSunset } from 'react-icons/fi';
import ModalSendConfirm from '../components/ModalSendConfirm/ModalSendConfirm';


const db = getFirestore();

const HomePage = () => {
  const { currentUserRole } = useAuth();
  const [isLg, setIsLg] = useState(window.innerWidth >= 1024);
  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ titulo: '', descricao: '' });
  const now = new Date();
  const isAfternoon = now.getHours() >= 12 && now.getHours() < 18 || (now.getHours() === 18 && now.getMinutes() < 20);
  const isNight = now.getHours() >= 18 && (now.getHours() > 18 || now.getMinutes() >= 20);




  const components = [
    <LastUserTicket key="userTicket" />,
    <LastSolicitacao key="solicitacao" />,
    <LastSolicitCompras key="solicitacompras" />
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsLg(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLg) {
      const interval = setInterval(() => {
        setIndex(prevIndex => (prevIndex + 1) % components.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLg, components.length]);

  const transitions = useSpring({
    opacity: 1,
    transform: `translateX(${index * -100}%)`,
    config: { mass: 5, tension: 500, friction: 80 }
  });

  // Função para verificar se o modal já foi aberto hoje
  const hasModalBeenOpenedToday = () => {
    const lastOpened = localStorage.getItem('lastModalOpenDate');
    const today = new Date().toLocaleDateString();
    return lastOpened === today;
  };

  // Função para marcar o modal como aberto hoje
  const markModalAsOpenedToday = () => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('lastModalOpenDate', today);
  };

  // Função para obter o índice da frase baseada na data
  const getDailyIndex = (arrayLength) => {
    const today = new Date();
    return today.getDate() % arrayLength; // Usa o dia do mês para selecionar o índice
  };

  // Escutando o status do msgHome no Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'modals', 'msgHome'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();

        // Verifica se o modal deve ser aberto e se não foi aberto hoje
        if (data.status && !hasModalBeenOpenedToday()) {
          // Define o índice da frase para mostrar no dia
          const index = getDailyIndex(data.descricao.length);
          setIsModalOpen(true);
          setModalContent({
            titulo: data.titulo || '',
            descricao: data.descricao[index] || '' // Mostra a frase específica do dia
          });
        }
      }
    });

    return () => unsubscribe(); // Limpar o listener ao desmontar
  }, []);

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    markModalAsOpenedToday();
  };


  return (
    <div className="pt-20 min-h-screen flex items-center justify-center bg-altBlue">
      {isLg ? (
        <div className='flex gap-2 items-center justify-center lg:flex-row flex-col'>
          <LastUserTicket />
          <LastSolicitacao />
          <LastSolicitCompras />
        </div>
      ) : (
        <div className='relative w-full max-w-xs h-full flex items-center justify-center overflow-hidden'>
          <animated.div
            style={transitions}
            className="flex w-full"
          >
            {components.map((Component, i) => (
              <div
                key={i}
                className="w-full flex-shrink-0"
              >
                {Component}
              </div>
            ))}
          </animated.div>
        </div>
      )}
      <NotificationModal />
      <FullNameModal />
      <ModalSendConfirm/>

      {/*MODAL DE MENSAGEM DO DIA*/}
      <MyModal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className='font-bold text-2xl mb-2 flex items-center'>
          {isNight ? (
            <>
              <FiSunset className='mr-2 text-yellow-500' /> Boa noite
            </>
          ) : isAfternoon ? (
            <>
              <FiSunset className='mr-2 text-yellow-500' /> Boa tarde
            </>
          ) : (
            <>
              <FiSun className='mr-2 text-yellow-500' /> Bom dia
            </>
          )}
        </h2>
        {/* Renderiza a descrição HTML */}
        <div dangerouslySetInnerHTML={{ __html: modalContent.descricao }} />
      </MyModal>
    </div>
  );
};

export default HomePage;
