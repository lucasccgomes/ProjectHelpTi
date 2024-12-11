import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { MdHelp } from "react-icons/md";
import { FaBars, FaTimes, FaTasks, FaUserCircle, FaHome, FaSignOutAlt, FaSignInAlt, FaChevronDown, FaChevronRight, FaClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import OfflineNotice from '../OffLineNotice/OfflineNotice';
import { IoLogoAndroid, IoDesktopSharp, IoDocumentTextSharp } from 'react-icons/io5';
import { SiCoinmarketcap } from "react-icons/si";
import { isDesktop } from 'react-device-detect';
import UserProfile from '../UserProfile/UserProfile';
import Modal from 'react-modal';
import { useSpring } from '@react-spring/web';
import MyModal from '../MyModal/MyModal'
import { doc, getDoc } from "firebase/firestore"; // Importe os métodos do Firestore
import { db } from "../../firebase"; // Importe a instância do Firestore configurada
import { RiLockPasswordFill } from "react-icons/ri";
import { GrResources } from "react-icons/gr";
import { FaTag } from "react-icons/fa";
import { MdAssessment } from "react-icons/md";

Modal.setAppElement('#root');

const Navbar = () => {
  const [senhaVSM, setSenhaVSM] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar se o menu está aberto
  const [openSubMenu, setOpenSubMenu] = useState(null); // Estado para controlar qual submenu está aberto
  const [installPrompt, setInstallPrompt] = useState(null); // Estado para armazenar o evento de instalação
  const [isInstalled, setIsInstalled] = useState(false); // Estado para verificar se o app está instalado
  const { isAuthenticated, logout, currentUser } = useAuth(); // Obtém o estado de autenticação e funções do contexto
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Estado para controlar a abertura do modal de perfil
  const navRef = useRef(null); // Referência para o elemento da barra de navegação
  const permittedRoles = ['T.I', 'Supervisor', 'Compras', 'Claudemir', 'Marketing']; // Lista de cargos permitidos


  const fetchSenhaDoDia = async () => {
    const today = new Date();
    const dia = today.getDate().toString().padStart(2, '0');
    const mes = (today.getMonth() + 1).toString().padStart(2, '0');
    const ano = today.getFullYear();
    const dataString = `${dia}/${mes}/${ano}`;
    const docRef = doc(db, "senhasVsm", "senhasDiaria");
    const docSnap = await getDoc(docRef);


    if (docSnap.exists()) {
      const senhas = docSnap.data();
      setSenhaVSM(senhas[dataString]); // Armazena a senha do dia no estado
    } else {
      console.log("Documento não encontrado");
    }
  };


  // Chame fetchSenhaDoDia no useEffect para carregar a senha ao montar o componente
  useEffect(() => {
    fetchSenhaDoDia();
  }, []);

  // Verifique se o usuário é "T.I." ou "Claudemir" antes de exibir a senha
  const isUserAllowed = currentUser?.cargo === "T.I";


  // Animação do modal
  const animationProps = useSpring({
    opacity: isProfileModalOpen ? 1 : 0, // Controla a opacidade do modal
    transform: isProfileModalOpen ? 'translateY(0)' : 'translateY(-20%)', // Controla a transformação de translação do modal
  });

  const navItems = [
    {
      name: 'Home', // Nome do item de navegação
      icon: FaHome, // Ícone do item de navegação
      href: '/' // Link para onde o item aponta
    },



    {
      name: 'Hora Certa',
      icon: FaClock,
      href: '/horacerta'
    },

    // Condição para exibir "Etiquetas p/ Envio" apenas para os cargos permitidos
    ...(permittedRoles.includes(currentUser?.cargo) ? [
      {
        name: 'Etiquetas p/ Envio',
        icon: FaTag,
        href: '/printpersonalizado'
      }
    ] : []),

    {
      name: 'Recursos Humanos',
      icon: GrResources,
      subItems: [ // Subitens para criar um submenu
        { name: 'Envio de Documentos', href: '/setorrh' },
        { name: 'Lista de Envios', href: '/listenvio' },
        { name: 'Gerencia RH', href: '/tipodoc' },
      ]
    },



    {
      name: 'Suporte Ti',
      icon: MdHelp,
      subItems: [
        { name: 'Abrir Chamados', href: '/usertickets' },
        { name: 'Solicitações', href: '/solicitati' },

        // Itens adicionais específicos para o cargo "T.I"
        ...(currentUser?.cargo === "T.I" ? [
          { name: 'Geren. Chamados', href: '/gerenchamados' },
          { name: 'Geren. Estoque', href: '/estoqueti' },
          { name: 'Geren. Servers', href: '/servers' },
          { name: 'Monitor Machine', href: '/monitormachine' },
          { name: 'Relatório Impressoras', href: '/printerlist' },
          { name: 'Relatório Chamados', href: '/relatorioti' },
          { name: 'Cadastrar Usuario', href: '/newuser' }
        ] : []),
      ]
    },


    {
      name: 'Marketing',
      icon: SiCoinmarketcap,
      subItems: [
        { name: 'Abrir Chamado', href: '/mknewchamados' },
        { name: 'Envio de Documentos', href: '/setormk' },
        { name: 'Lista de Envios', href: '/listenviomk' },
        { name: 'Tipo Doc', href: '/tipodocmk' },

        // Itens adicionais específicos para o cargo "T.I"
        ...(currentUser?.cargo === "Marketing" ? [
          { name: 'Geren. Chamados', href: '/mkchamados' },
          { name: 'Web Panfleto', href: '/webpanfleto' },
        ] : []),

        ...(currentUser?.cargo === "Marketing", "T.I" ? [
          { name: 'Uploud MP3', href: '/anunciamp3' },
          { name: 'Video Senhas', href: '/videosenhas' },
        ] : []),
      ]
    },



    // {
    //   name: 'Compras',
    //   icon: FaCartShopping,
    //   subItems: [
    //     { name: 'Solicitações', href: '/solicitacompras' },
    //     { name: 'Geren. Estoque', href: '/estoque' },
    //     { name: 'Relatório tipo log', href: '/reportcompras' },
    //     { name: 'Relatório de Custos', href: '/custocompras' },
    //   ]
    // },



    {
      name: 'Tarefas',
      icon: FaTasks,
      href: '/atribute'
    },

    {
      name: 'Avalição',
      icon: MdAssessment,
      subItems: [
        // Itens adicionais específicos para o cargo "T.I"
        ...(currentUser?.cargo === "T.I", "Gerente", "Claudemir", "Supervisor", "Marketing" ? [
          { name: 'Relatorio', href: '/relatavaliacao' },
        ] : []),
      ]
    },
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Impede o comportamento padrão do prompt de instalação
      setInstallPrompt(e); // Armazena o evento do prompt de instalação
      console.log("beforeinstallprompt event captured"); // Loga quando o evento é capturado
    };

    const checkInstalledStatus = async () => {
      if ('getInstalledRelatedApps' in navigator) {
        const relatedApps = await navigator.getInstalledRelatedApps(); // Verifica se há apps relacionados instalados
        setIsInstalled(relatedApps.length > 0); // Atualiza o estado com base na verificação
        console.log("Installed apps:", relatedApps); // Loga os apps instalados
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
          console.log('User accepted the install prompt'); // Loga se o usuário aceitou a instalação
        } else {
          console.log('User dismissed the install prompt'); // Loga se o usuário rejeitou a instalação
        }
        setInstallPrompt(null); // Reseta o evento do prompt de instalação
      });
    }
  };

  const handleClickOutside = (event) => {
    if (navRef.current && !navRef.current.contains(event.target)) {
      setIsOpen(false); // Fecha o menu se clicar fora dele
      setOpenSubMenu(null); // Fecha o submenu se clicar fora dele
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside); // Adiciona o evento de clique fora do menu
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Remove o evento ao desmontar o componente
    };
  }, []);

  const handleSubMenuClick = (index) => {
    setOpenSubMenu(openSubMenu === index ? null : index); // Abre ou fecha o submenu baseado no índice
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true); // Abre o modal de perfil
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false); // Fecha o modal de perfil
  };

  return (
    <div className="flex" id='navBar'>
      {/* Botão para abrir o menu lateral */}
      <div className="bg-primaryBlueDark z-10 w-full h-14 fixed flex items-center justify-end">
        <div className="mx-4">
          <a className="p-2 flex bg-slate-300 rounded-lg shadow-md hover:scale-[0.9]" target="_blank" href="https://admhelpti.netlify.app/">
            <button className="text-black flex flex-row justify-center items-center gap-1">
              <IoDocumentTextSharp /> Manual
            </button>
          </a>
        </div>
        {!isInstalled && installPrompt && (
          <button
            onClick={handleInstallClick}
            className="p-2 rounded-md flex items-center text-white bg-green-600 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white mr-auto ml-4"
          >
            {isDesktop ? (
              <IoDesktopSharp className='text-xl' />
            ) : (
              <IoLogoAndroid className='text-xl' />
            )}
            &nbsp;Instalar App
          </button>
        )}
        <div className="mx-4">
          {isUserAllowed && senhaVSM ? (
            <div className="text-white flex justify-center items-center gap-2 bg-slate-400 p-2 rounded-xl">
              <p>
                <RiLockPasswordFill />
              </p>
              <p>
                {senhaVSM}
              </p>
            </div>
          ) : (
            <div className="text-white"></div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white fixed z-50"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
        >
          <span className="sr-only">Open main menu</span>
          {!isOpen ? (
            <FaBars className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <FaTimes className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>

        <div
          onClick={openProfileModal} // Abre o modal ao clicar no nome ou ícone do usuário
          className={`flex items-center gap-1 mr-16 text-white uppercase cursor-pointer transition-transform duration-300 ease-in-out ${isOpen ? "opacity-0 transform -translate-x-10" : "opacity-100 transform translate-x-0"
            }`}
        >
          {currentUser?.imageUrl ? (
            <img
              src={currentUser.imageUrl}
              alt="User profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="w-8 h-8" />
          )}
          {currentUser ? currentUser.user : ''}
        </div>
      </div>
      {/* Menu lateral */}
      <nav ref={navRef} className={`fixed inset-y-0 left-0 bg-primaryBlueDark z-50 text-white w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <div className="p-4">
          <div
            onClick={openProfileModal} // Abre o modal ao clicar no nome ou ícone do usuário
            className={`flex items-center justify-center gap-1 uppercase mb-4 cursor-pointer transition-transform duration-300 ease-in-out ${isOpen ? "opacity-100 transform translate-x-0 delay-300" : "opacity-0 transform -translate-x-10"
              }`}
          >
            {currentUser?.imageUrl ? (
              <img
                src={currentUser.imageUrl}
                alt="User profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-8 h-8" />
            )}
            {currentUser ? currentUser.user : ''}
          </div>
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <div key={item.name}>
                {!item.subItems ? (
                  <Link
                    to={item.href}
                    className="flex justify-between items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2" /> {item.name}
                    </div>
                  </Link>
                ) : (
                  <div
                    className="flex justify-between items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                    onClick={() => handleSubMenuClick(index)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2" /> {item.name}
                    </div>
                    <div className="transition-transform duration-300">
                      {openSubMenu === index ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                  </div>
                )}
                {item.subItems && openSubMenu === index && (
                  <div className="pl-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                        onClick={() => setIsOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <FaSignOutAlt className="mr-2" /> Sair
              </button>
            ) : (
              <Link
                to="/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <FaSignInAlt className="mr-2" /> Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      <OfflineNotice />

      {/* Modal para exibir UserProfile */}
      <MyModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
      >
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Perfil</h2>
        </div>
        <UserProfile />
      </MyModal>
    </div>
  );
};

export default Navbar;
