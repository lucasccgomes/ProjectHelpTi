import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NotificationModal from '../components/NotificationModal/NotificationModal';

const TimeClock = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await axios.get('https://worldtimeapi.org/api/timezone/America/Sao_Paulo');
        const datetime = response.data.datetime;
        setTime(datetime);
        setDate(formatDate(datetime));
      } catch (error) {
        console.error('Error fetching the time:', error);
      }
    };

    fetchTime();

    const interval = setInterval(() => {
      fetchTime();
    }, 1000); // Atualiza a cada 60 segundos para evitar muitas requisições

    return () => clearInterval(interval);
  }, []);

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); // Removendo os segundos
  };

  const formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 p-4">
      <h1 className="text-xl font-medium mb-4">Horário de Brasília</h1>
      <h2 className="text-6xl font-mono">{time ? formatTime(time) : 'Carregando...'}</h2>
      <p className="text-lg mt-2">{date}</p>
      <NotificationModal />
    </div>
  );
};

export default TimeClock;
