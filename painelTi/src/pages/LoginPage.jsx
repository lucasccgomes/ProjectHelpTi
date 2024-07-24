import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { IoLogoAndroid, IoDesktopSharp } from 'react-icons/io5';
import { isDesktop } from 'react-device-detect';
import OfflineNotice from '../components/OffLineNotice/OfflineNotice';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => { });
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      alert('Usuário ou senha incorretos');
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
      } else {
        console.log('Usuário rejeitou a instalação');
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <img className='w-24' src={logo} alt="" />
      <div className='flex flex-row mb-10 justify-center items-center'>
        <h1 className='font-bold text-6xl text-[#002d56] '>ADM HelpTi</h1>
      </div>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              autoComplete="off"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </button>
          </div>
        </form>
        {deferredPrompt && (
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
      <OfflineNotice />
    </div>
  );
};

export default LoginPage;
