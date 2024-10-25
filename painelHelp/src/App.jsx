import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar/NavBar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserTickets from './pages/UserTickets';
import NoPermission from './pages/NoPermission';
import AssignTasksPage from './pages/AssignTaskPage';
import { messaging, getToken, db, isSupported } from './firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import TimeClock from './pages/TimeClock';
import SoliciteCompras from './pages/SoliciteCompras';
import Estoque from './pages/Estoque';
import FullReportCompras from './pages/RelatorioCompras';
import CustoCompras from './pages/CustoCompras';
import GerenciadorChamados from './pages/GerenciadorChamados';
import SoliciteTi from './pages/SoliciteTi';
import EstoqueTi from './pages/EstoqueTi';
import UpdateSystemModal from './components/UpdateSystemModal/UpdateSystemModal';
import SetorRh from './pages/setorRh';
import ListRhDocs from './components/ListRhDocs/ListRhDocs';
import GerenciadorServers from './pages/GerenciadorServers';
import RelatorioCompras from './components/RelatorioCompras/RelatorioCompras';
import RelatorioProblema from './pages/RelatorioProblema';
import UserForm from './pages/UserFormPage';
import DocRh from './pages/DocRh';
import PrintList from './pages/printList';
import MonitorMachine from './pages/MonitorMachine';

const useUpdateChecker = (onUpdateAvailable) => {
  useEffect(() => {
    const docRef = doc(db, 'systemUpdate', 'gerenciadorSystem');
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const previousUpdateState = localStorage.getItem('lastUpdateState') === 'true';
        const currentUpdateState = data.Update;

        if (currentUpdateState && !previousUpdateState) {
          console.log('Atualização detectada no Firestore.');
          onUpdateAvailable();
        }

        // Salva o estado atual do campo Update no localStorage
        localStorage.setItem('lastUpdateState', currentUpdateState);
      }
    }, (error) => {
      console.error("Erro ao monitorar o Firestore: ", error);
    });

    return () => unsubscribe();
  }, [onUpdateAvailable]);
};

const App = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useUpdateChecker(() => {
    setUpdateAvailable(true);
    let count = 10;
    const intervalId = setInterval(() => {
      if (count > 0) {
        setCountdown(count--);
      } else {
        clearInterval(intervalId);
        console.log('Contagem regressiva concluída. Atualizando...');
        window.location.reload(); // Atualiza automaticamente quando a contagem chegar a 0
      }
    }, 1000);
  });

  return (
    <Router>
      <AuthProvider>
        <AuthConsumer>
          {({ isAuthenticated, currentUser }) => (
            <>
              {isAuthenticated && <Navbar currentUser={currentUser} />}
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/usertickets" element={
                  <ProtectedRoute>
                    <UserTickets />
                  </ProtectedRoute>
                }
                />
                <Route path="/solicitati" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Gerente',
                  'Supervisor',
                  'Compras',
                  'Claudemir'
                ]}
                >
                  <SoliciteTi />
                </ProtectedRoute>
                }
                />
                <Route path="/estoqueti" element={
                  <ProtectedRoute allowedRoles={[
                    'T.I',
                    'Claudemir'
                  ]}
                  >
                    <EstoqueTi />
                  </ProtectedRoute>
                }
                />
                <Route path="/atribute" element={
                  <ProtectedRoute allowedRoles={[
                    'T.I',
                    'Gerente',
                    'Supervisor',
                    'Compras',
                    'Claudemir',
                    'RH',
                    'Marketing',
                  ]}
                  >
                    <AssignTasksPage />
                  </ProtectedRoute>
                }
                />
                <Route path="/solicitacompras" element={
                  <ProtectedRoute allowedRoles={[
                    'T.I',
                    'Compras',
                    'Claudemir'
                  ]}
                  >
                    <SoliciteCompras />
                  </ProtectedRoute>
                }
                />
                <Route path="/horacerta" element={
                  <ProtectedRoute>
                    <TimeClock />
                  </ProtectedRoute>
                }
                />
                <Route path="/estoque" element={
                  <ProtectedRoute allowedRoles={[
                    'T.I',
                    'Compras',
                    'Claudemir'
                  ]}
                  >
                    <Estoque />
                  </ProtectedRoute>
                }
                />
                <Route path="/reportcompras" element={
                  <ProtectedRoute allowedRoles={[
                    'T.I',
                    'Compras',
                    'Claudemir'
                  ]}
                  >
                    <FullReportCompras />
                  </ProtectedRoute>
                }
                />
                <Route path="/custocompras" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Compras',
                  'Claudemir'
                ]}
                >
                  <CustoCompras />
                </ProtectedRoute>
                }
                />
                <Route path="/gerenchamados" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <GerenciadorChamados />
                </ProtectedRoute>
                }
                />
                <Route path="/setorrh" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Gerente',
                  'Supervisor',
                  'RH',
                  'Claudemir'
                ]}
                >
                  <SetorRh />
                </ProtectedRoute>
                }
                />

                <Route path="/listenvio" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Gerente',
                  'Supervisor',
                  'RH',
                  'Claudemir'
                ]}
                >
                  <ListRhDocs />
                </ProtectedRoute>
                }
                />

                <Route path="/tipodoc" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'RH',
                ]}
                >
                  <DocRh />
                </ProtectedRoute>
                }
                />

                <Route path="/relatorioti" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <RelatorioProblema />
                </ProtectedRoute>
                }
                />

                <Route path="/newuser" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                ]}
                >
                  <UserForm />
                </ProtectedRoute>
                }
                />

                <Route path="/servers" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <GerenciadorServers />
                </ProtectedRoute>
                }
                />

                <Route path="/printerlist" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <PrintList />
                </ProtectedRoute>
                }
                />

                <Route path="/monitormachine" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <MonitorMachine />
                </ProtectedRoute>
                }
                />

                <Route path="/nopermission" element={<NoPermission />} />
              </Routes>
              {isAuthenticated && <FCMHandler currentUser={currentUser} />}
              {updateAvailable && <UpdateSystemModal countdown={countdown} />}
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
                      [`${userId}.token`]: arrayUnion(currentToken)
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
