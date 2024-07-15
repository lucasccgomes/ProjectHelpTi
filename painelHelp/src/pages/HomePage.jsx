import React from 'react';
import UserTickets from '../components/UserTickets';
import Solicitacao from '../components/Solicitacao';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { currentUserRole } = useAuth();

  return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {(currentUserRole === 'Supervisor' || currentUserRole === 'Gerente') && <Solicitacao />}
      <UserTickets />
    </div>
  );
};

export default HomePage;
