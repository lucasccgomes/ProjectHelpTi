import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { MdHelp } from "react-icons/md";
import { FaBars, FaTimes, FaTasks, FaUserCircle, FaHome, FaSignOutAlt, FaSignInAlt, FaChevronDown, FaChevronRight, FaClock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import OfflineNotice from '../OffLineNotice/OfflineNotice';
import { IoLogoAndroid, IoDesktopSharp } from 'react-icons/io5';
import { FaCartShopping } from "react-icons/fa6";
import { isDesktop } from 'react-device-detect';

const Navbar = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navRef = useRef(null);

  const navItems = [
    {
      name: 'Home',
      icon: FaHome,
      href: '/'
    },
    {
      name: 'Hora Certa',
      icon: FaClock,
      href: '/horacerta'
    },
    {
      name: 'Suporte Ti',
      icon: MdHelp,
      subItems: [
        { name: 'Chamados', href: '/usertickets' },
        { name: 'Solicitações', href: '/solicitacao' },
      ]
    },
    {
      name: 'Compras',
      icon: FaCartShopping,
      subItems: [
        { name: 'Solicitações', href: '/solicitacompras' },
        { name: 'Estoque', href: '/estoque' },
      ]
    },
    {
      name: 'Tarefas',
      icon: FaTasks,
      href: '/atribute'
    },
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("beforeinstallprompt event captured");  // Debugging
    };

    const checkInstalledStatus = async () => {
      if ('getInstalledRelatedApps' in navigator) {
        const relatedApps = await navigator.getInstalledRelatedApps();
        setIsInstalled(relatedApps.length > 0);
        console.log("Installed apps:", relatedApps);  // Debugging
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkInstalledStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
      });
    }
  };

  const handleClickOutside = (event) => {
    if (navRef.current && !navRef.current.contains(event.target)) {
      setIsOpen(false);
      setOpenSubMenu(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubMenuClick = (index) => {
    setOpenSubMenu(openSubMenu === index ? null : index);
  };

  return (
    <div className="flex">
      {/* Botão para abrir o menu lateral */}
      <div className="bg-primaryBlueDark w-full h-14 fixed flex items-center z-10 justify-end">
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
          className={`flex items-center gap-1 mr-16 text-white uppercase transition-transform duration-300 ease-in-out ${isOpen ? "opacity-0 transform -translate-x-10" : "opacity-100 transform translate-x-0"
            }`}
        >
          <FaUserCircle /> {currentUser ? currentUser.user : ''}
        </div>
      </div>
      {/* Menu lateral */}
      <nav ref={navRef} className={`fixed inset-y-0 left-0 bg-primaryBlueDark z-50 text-white w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <div className="p-4">
          <div
            className={`flex items-center justify-center gap-1 uppercase mb-4 transition-transform duration-300 ease-in-out ${isOpen ? "opacity-100 transform translate-x-0 delay-300" : "opacity-0 transform -translate-x-10"
              }`}
          >
            <FaUserCircle /> {currentUser ? currentUser.user : ''}
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
    </div>
  );
};

export default Navbar;
