import React, { useState } from 'react';
import UserTickets from '../components/UserTickets';




const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <UserTickets />
    </div>
  );
};

export default HomePage;
