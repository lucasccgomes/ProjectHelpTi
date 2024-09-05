import { useState, useEffect } from 'react';

// Hook para verificar atualizações
const useUpdateChecker = (onUpdateAvailable) => {
  useEffect(() => {
    const checkForUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                onUpdateAvailable();
              }
            };
          }
        };
      }
    };

    // Verifica atualizações ao montar o componente
    checkForUpdate();

    // Adiciona um listener para quando o Service Worker estiver atualizado
    const handleServiceWorkerUpdate = () => {
      window.location.reload();
    };

    window.addEventListener('updatefound', handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener('updatefound', handleServiceWorkerUpdate);
    };
  }, [onUpdateAvailable]);
};

export default useUpdateChecker;
