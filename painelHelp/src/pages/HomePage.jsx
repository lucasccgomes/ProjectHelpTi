import React from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { currentUserRole } = useAuth();

  return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-gray-100">
    
    </div>
  );
};

export default HomePage;
