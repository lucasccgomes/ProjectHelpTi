import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import OfflineNotice from '../components/OffLineNotice/OfflineNotice';
import { IoLogoAndroid, IoDesktopSharp } from 'react-icons/io5';
import { isDesktop } from 'react-device-detect';
import MyModal from '../components/MyModal/MyModal';

const LoginPage = () => {
  const [username, setUsername] = useState(''); // Estado para armazenar o nome de usuário
  const [password, setPassword] = useState(''); // Estado para armazenar a senha
  const [installPrompt, setInstallPrompt] = useState(null); // Estado para armazenar o evento de prompt de instalação
  const [isInstalled, setIsInstalled] = useState(false); // Estado para verificar se o aplicativo está instalado
  const navigate = useNavigate(); // Hook para navegação entre páginas
  const { login } = useAuth(); // Hook para acessar a função de login do contexto de autenticação
  const { isAuthenticated } = useAuth(); // Obtenha o estado de autenticação do contexto
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false); // Estado para controlar o modal de manutenção


  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Impede o comportamento padrão do prompt de instalação
      setInstallPrompt(e); // Armazena o evento de prompt de instalação
      //console.log("beforeinstallprompt event captured"); // Loga quando o evento é capturado
    };

    const checkInstalledStatus = async () => {
      if ('getInstalledRelatedApps' in navigator) {
        const relatedApps = await navigator.getInstalledRelatedApps(); // Verifica se há aplicativos relacionados instalados
        setIsInstalled(relatedApps.length > 0); // Atualiza o estado com base na verificação
        //console.log("Installed apps:", relatedApps); // Loga os aplicativos instalados
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt); // Adiciona o evento de captura do prompt de instalação
    checkInstalledStatus(); // Verifica o status de instalação

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); // Remove o evento ao desmontar o componente
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt(); // Mostra o prompt de instalação
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          //console.log('User accepted the install prompt'); // Loga se o usuário aceitou a instalação
        } else {
          //console.log('User dismissed the install prompt'); // Loga se o usuário rejeitou a instalação
        }
        setInstallPrompt(null); // Reseta o evento do prompt de instalação
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // Impede o comportamento padrão do formulário

    try {
      await login(username, password); // Tenta realizar o login com as credenciais fornecidas
      requestNotificationPermission(); // Solicita permissão de notificação após o login
      navigate('/'); // Navega para a página inicial após o login bem-sucedido
    } catch (error) {
      console.error('Erro ao fazer login:', error);

      // Verifique se o erro é "Quota exceeded"
      if (error.message.includes('Quota exceeded')) {
        setIsMaintenanceModalOpen(true); // Abre o modal de manutenção
      } else if (error.message === 'Usuário não encontrado ou credenciais inválidas') {
        alert('Usuário ou senha incorretos');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redireciona para a página inicial se estiver autenticado
    }
  }, [isAuthenticated, navigate]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const status = await Notification.requestPermission(); // Solicita permissão para enviar notificações
        if (status === 'granted') {
          //console.log('Permissão de notificação concedida.'); // Loga se a permissão for concedida
        } else {
          //console.log('Permissão de notificação não concedida.'); // Loga se a permissão não for concedida
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error); // Loga o erro se a solicitação falhar
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className='flex flex-col mb-10 justify-center items-center'>
        <img className='w-24' src={logo} alt="" />
        <h1 className='font-bold text-6xl text-[#002d56] '>LiraSystem</h1>
      </div>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl text-[#002d56] font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              autoComplete="off"
              autoCapitalize="none"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              autoComplete="off"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-[#002d56] w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </button>
          </div>
        </form>

        {!isInstalled && installPrompt && (
          <button
            onClick={handleInstallClick}
            className="mt-4 w-full p-2 rounded-md flex justify-center items-center text-white bg-green-600 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            {isDesktop ? (
              <IoDesktopSharp className='text-xl' />
            ) : (
              <IoLogoAndroid className='text-xl' />
            )}
            &nbsp;Instalar App
          </button>
        )}
      </div>
      {/* Modal de Manutenção */}
      <MyModal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} showCloseButton={true}>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Sistema em Manutenção</h2>
          <p className="mb-6">Desculpe o transtorno! Estamos trabalhando para resolver o problema.</p>
          <div className="space-y-4">
            <button
              onClick={() => window.open('https://wa.me/5547991399367', '_blank')}
              className="w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center hover:bg-green-600"
            >
              WhatsApp: (47) 99139-9367
            </button>
            <button
              onClick={() => window.open('https://wa.me/55018997530027', '_blank')}
              className="w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center hover:bg-green-600"
            >
              WhatsApp: (18) 99753-0027
            </button>
          </div>
        </div>
      </MyModal>
      <OfflineNotice />
    </div>
  );
};

export default LoginPage;
