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
import RelatorioProblema from './pages/RelatorioProblema';
import UserForm from './pages/UserFormPage';
import DocRh from './pages/DocRh';
import PrintList from './pages/printList';
import MonitorMachine from './pages/MonitorMachine';
import EditWebPanfleto from './pages/EditWebPanfleto';
import PrintForm from './pages/PrintForm';
import AnuncioMp3 from './pages/AnuncioMp3';
import MkUserTickets from './pages/MkUserTickets';
import MkGerenciadorChamados from './pages/MkGerenciadorChamados';
import AvaliacoesConsulta from './pages/AvaliacoesConsulta';
import TelaPass from './pages/TelaPass';
import DocMK from './pages/DocMK';
import ListMarketingDocs from './components/ListMarketingDocs/ListMarketingDocs';
import SetorMK from './pages/setorMK';
import ManagerFrasesPass from './pages/ManagerFrasesPass';
import RoutDadosLojas from './pages/RoutDadosLojas';
import RoutPbmsLojas from './pages/RoutPbmsLojas';
import Routdiversos from './pages/Routdiversos';
import RoutVisitaSuper from './pages/RoutVisitaSuper';
import RoutVisitaGerente from './pages/RoutVisitaGerente';
import RelatorioConsumo from './pages/RelatorioConsumo';
import MonitorSql from './components/MonitorSql/MonitorSql';

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

                <Route path="/printpersonalizado" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Compras',
                  'Claudemir',
                  'RH',
                  'Marketing'
                ]}
                >
                  <PrintForm />
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

                <Route path="/dadoslojas" element={
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
                    <RoutDadosLojas />
                  </ProtectedRoute>
                }
                />

                <Route path="/pbms" element={
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
                    <RoutPbmsLojas />
                  </ProtectedRoute>
                }
                />

                <Route path="/pbms" element={
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
                    <RoutPbmsLojas />
                  </ProtectedRoute>
                }
                />

                <Route path="/visitasuper" element={
                  <ProtectedRoute allowedRoles={[
                    'Supervisor',
                    'T.I',
                    'Claudemir',
                  ]}
                  >
                    <RoutVisitaSuper />
                  </ProtectedRoute>
                }
                />

                <Route path="/visitagerent" element={
                  <ProtectedRoute allowedRoles={[
                    'Gerente',
                    'T.I',
                  ]}
                  >
                    <RoutVisitaGerente />
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
                    'Financeiro',
                  ]}
                  >
                    <AssignTasksPage />
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

                <Route path="/monitorsql" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <MonitorSql />
                </ProtectedRoute>
                }
                />

                <Route path="/relatconsumoti" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <RelatorioConsumo />
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
                  'Supervisor',
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


                <Route path="/webpanfleto" element={<ProtectedRoute allowedRoles={[
                  'Marketing',
                  'Claudemir'
                ]}
                >
                  <EditWebPanfleto />
                </ProtectedRoute>
                }
                />

                <Route path="/anunciamp3" element={<ProtectedRoute allowedRoles={[
                  'Marketing',
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <AnuncioMp3 />
                </ProtectedRoute>
                }
                />
                <Route path="/mknewchamados" element={
                  <ProtectedRoute>
                    <MkUserTickets />
                  </ProtectedRoute>
                }
                />

                <Route path="/mkchamados" element={<ProtectedRoute allowedRoles={[
                  'Marketing',
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <MkGerenciadorChamados />
                </ProtectedRoute>
                }
                />

                <Route path="/videosenhas" element={<ProtectedRoute allowedRoles={[
                  'Marketing',
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <TelaPass />
                </ProtectedRoute>
                }
                />



                <Route path="/setormk" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Gerente',
                  'Supervisor',
                  'Marketing',
                  'Claudemir'
                ]}
                >
                  <SetorMK />
                </ProtectedRoute>
                }
                />

                <Route path="/listenviomk" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Gerente',
                  'Supervisor',
                  'Marketing',
                  'Claudemir'
                ]}
                >
                  <ListMarketingDocs />
                </ProtectedRoute>
                }
                />

                <Route path="/tipodocmk" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Marketing',
                ]}
                >
                  <DocMK />
                </ProtectedRoute>
                }
                />

                <Route path="/frasestelasenhas" element={<ProtectedRoute allowedRoles={[
                  'T.I',
                  'Marketing',
                ]}
                >
                  <ManagerFrasesPass />
                </ProtectedRoute>
                }
                />



                <Route path="/relatavaliacao" element={<ProtectedRoute allowedRoles={[
                  'Marketing',
                  'T.I',
                  'Claudemir'
                ]}
                >
                  <AvaliacoesConsulta />
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
