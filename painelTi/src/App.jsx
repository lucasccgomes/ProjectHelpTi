import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserForm from './pages/UserFormPage';
import Relatorio from './pages/Relatorio';
import Estoque from './pages/Estoque';
import Impressora from './pages/Impressora';
import { messaging, getToken, db, isSupported } from './firebase'; // Ajuste o caminho conforme necessário
import { doc, updateDoc } from 'firebase/firestore';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthConsumer>
          {({ isAuthenticated, currentUser }) => (
            <>
              {isAuthenticated && <Navbar />}
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/userform"
                  element={
                    <ProtectedRoute>
                      <UserForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/relatorio"
                  element={
                    <ProtectedRoute>
                      <Relatorio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estoque"
                  element={
                    <ProtectedRoute>
                      <Estoque />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/impressora"
                  element={
                    <ProtectedRoute>
                      <Impressora />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
              </Routes>
              <FCMHandler currentUser={currentUser} />
            </>
          )}
        </AuthConsumer>
      </Router>
    </AuthProvider>
  );
};

const AuthConsumer = ({ children }) => {
  const authContext = useAuth();
  return children(authContext);
};

const FCMHandler = ({ currentUser }) => {
  const [messagingInitialized, setMessagingInitialized] = useState(false);

  useEffect(() => {
    const initializeMessaging = async () => {
      const supported = await isSupported();
      if (supported) {
        console.log("Firebase Messaging é suportado neste navegador.");
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registrado com sucesso:', registration);
            setMessagingInitialized(true);
          } catch (error) {
            console.error('Erro ao registrar o Service Worker:', error);
          }
        } else {
          console.warn('Service Worker não está disponível neste navegador.');
        }
      } else {
        console.warn('Firebase Messaging não é suportado neste navegador.');
      }
    };

    initializeMessaging();
  }, []);

  useEffect(() => {
    const initializeFCM = async () => {
      if (messagingInitialized && currentUser && messaging) {
        try {
          const status = await Notification.requestPermission();
          if (status === 'granted') {
            const currentToken = await getToken(messaging, { vapidKey: "BE5sqRiJ8biSfqOey7rpe7SFvbQmnp8mm5R71wtQfW45l-eWs5MHDZBtLGQ3yS4NE5u-Y_LDAWBoREkYlK0I_FU" });
            if (currentToken) {
              console.log('Token FCM obtido:', currentToken);
              const userId = currentUser.user; // Ajuste conforme necessário
              const userCity = currentUser.cidade; // Ajuste conforme necessário
              if (typeof userId === 'string' && userId.trim() !== '' && typeof userCity === 'string' && userCity.trim() !== '') {
                const userDocRef = doc(db, 'usuarios', userCity);
                await updateDoc(userDocRef, {
                  [`${userId}.token`]: currentToken
                });
                console.log('Token salvo com sucesso no Firestore');
              } else {
                console.error('Usuário ou cidade inválido:', currentUser);
              }
            } else {
              console.log('Nenhum token FCM disponível. Solicite permissão para gerar um.');
            }
          } else {
            console.log('Permissão de notificação não concedida.');
          }
        } catch (err) {
          console.error('Erro ao obter o token FCM:', err);
        }
      } else {
        console.warn('Firebase Messaging não é suportado neste navegador ou Service Worker não está disponível.');
      }
    };

    initializeFCM();
  }, [messagingInitialized, currentUser]);

  return null;
};

export default App;
