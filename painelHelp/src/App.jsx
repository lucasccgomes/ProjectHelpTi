import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserTickets from './pages/UserTickets';
import Solicitacao from './pages/Solicitacoes';
import NoPermission from './pages/NoPermission';
import AssignTasksPage from './pages/AssignTaskPage';
import { messaging, getToken, db, isSupported } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import TimeClock from './pages/TimeClock';
import SoliciteCompras from './pages/SoliciteCompras';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AuthConsumer>
          {({ isAuthenticated, currentUser }) => (
            <>
              {isAuthenticated && <Navbar currentUser={currentUser} />}
              <Routes>
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/usertickets" element={<ProtectedRoute>
                  <UserTickets />
                  </ProtectedRoute>} 
                  />
                <Route path="/solicitacao" element={<ProtectedRoute allowedRoles={['T.I', 'Gerente', 'Supervisor']}>
                  <Solicitacao />
                  </ProtectedRoute>}
                   />
                <Route path="/atribute" element={<ProtectedRoute allowedRoles={['T.I']}>
                  <AssignTasksPage />
                  </ProtectedRoute>} 
                  />
                  <Route path="/solicitacompras" element={<ProtectedRoute allowedRoles={['T.I']}>
                  <SoliciteCompras />
                  </ProtectedRoute>} 
                  />
                <Route path="/horacerta" element={<ProtectedRoute>
                  <TimeClock />
                  </ProtectedRoute>} 
                  />
                <Route path="/nopermission" element={<NoPermission />} />
              </Routes>
              {isAuthenticated && <FCMHandler currentUser={currentUser} />}
            </>
          )}
        </AuthConsumer>
      </AuthProvider>
    </Router>
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

            const waitForServiceWorkerActivation = async () => {
              return new Promise((resolve) => {
                if (registration.active) {
                  resolve();
                } else {
                  const interval = setInterval(() => {
                    if (registration.active) {
                      clearInterval(interval);
                      resolve();
                    }
                  }, 100);
                }
              });
            };

            await waitForServiceWorkerActivation();
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
            console.log('Permissão de notificação concedida. Tentando obter o token FCM...');
            
            let tokenCaptured = false;
            while (!tokenCaptured) {
              try {
                const currentToken = await getToken(messaging, { vapidKey: "BE5sqRiJ8biSfqOey7rpe7SFvbQmnp8mm5R71wtQfW45l-eWs5MHDZBtLGQ3yS4NE5u-Y_LDAWBoREkYlK0I_FU" });
                if (currentToken) {
                  console.log('Token FCM obtido:', currentToken);
                  const { user: userId, cidade: userCity } = currentUser;
                  if (typeof userId === 'string' && userId.trim() !== '' && typeof userCity === 'string' && userCity.trim() !== '') {
                    const userDocRef = doc(db, 'usuarios', userCity);
                    await updateDoc(userDocRef, {
                      [`${userId}.token`]: currentToken
                    });
                    console.log('Token salvo com sucesso no Firestore');
                  } else {
                    console.error('Usuário ou cidade inválido:', currentUser);
                  }
                  tokenCaptured = true;
                } else {
                  console.log('Nenhum token FCM disponível. Tentando novamente...');
                }
              } catch (err) {
                console.error('Erro ao obter o token FCM:', err);
              }
              if (!tokenCaptured) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }
          } else {
            console.log('Permissão de notificação não concedida.');
          }
        } catch (err) {
          console.error('Erro ao solicitar permissão de notificação:', err);
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
