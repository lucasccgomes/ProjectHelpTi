import { useState, useEffect } from 'react';
import { RiWifiOffLine } from "react-icons/ri";

const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <RiWifiOffLine className="text-white text-6xl mb-4" />
      <div className="text-white text-lg text-center">
        Você está offline. Verifique sua conexão com a internet.
      </div>
    </div>
  );
};

export default OfflineNotice;
