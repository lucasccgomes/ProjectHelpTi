import React from 'react';

const NotificationHandler = ({ user, message, onSent, isSending }) => {
  return (
    <div>
      {isSending ? (
        <p>Enviando notificação para {user.user} sobre {message.title}...</p>
      ) : (
        <p>Notificação enviada para {user.user} sobre {message.title}</p>
      )}
    </div>
  );
};

export default NotificationHandler;
