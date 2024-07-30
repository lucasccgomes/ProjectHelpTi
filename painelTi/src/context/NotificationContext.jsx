import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [sentNotifications, setSentNotifications] = useState(new Set());

  const markAsSent = (id) => {
    setSentNotifications((prev) => new Set(prev).add(id));
  };

  const hasBeenSent = (id) => {
    return sentNotifications.has(id);
  };

  return (
    <NotificationContext.Provider value={{ markAsSent, hasBeenSent }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};
