import React, { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useAuth } from '../context/AuthContext';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import LastUserTicket from '../components/LastUserTicket/LastUserTicket';
import LastSolicitacao from '../components/LastSolicitacao/LastSolicitacao';

const HomePage = () => {
  const { currentUserRole } = useAuth();
  const [isLg, setIsLg] = useState(window.innerWidth >= 1024);
  const [index, setIndex] = useState(0);
  const components = [<LastUserTicket key="userTicket" />, <LastSolicitacao key="solicitacao" />];

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

  return (
    <div className="pt-20 min-h-screen flex items-center justify-center bg-altBlue">
      {isLg ? (
        <div className='flex gap-2 items-center justify-center lg:flex-row flex-col'>
          <LastUserTicket />
          <LastSolicitacao />
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
    </div>
  );
};

export default HomePage;
