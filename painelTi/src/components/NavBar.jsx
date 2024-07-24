import { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaUsers, FaSignOutAlt, FaSignInAlt, FaUserCircle } from 'react-icons/fa';
import { MdOutlineBugReport } from "react-icons/md";
import { IoPrintSharp } from "react-icons/io5";
import { CgShutterstock } from "react-icons/cg";
import { useAuth } from '../context/AuthContext';
import OfflineNotice from "./OffLineNotice/OfflineNotice";

const Navbar = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navRef = useRef(null);

  const navItems = [
    { name: 'Home', icon: FaHome, href: '/' },
    { name: 'Novo Usuario', icon: FaUsers, href: '/userform' },
    { name: 'Relatório', icon: MdOutlineBugReport, href: '/relatorio' },
    { name: 'Solicitações', icon: IoPrintSharp , href: '/solicitacao' },
    { name: 'Estoque', icon: CgShutterstock, href: '/estoque' },
    { name: 'Impressoras', icon: IoPrintSharp , href: '/impressora' },
  ];

  const handleClickOutside = (event) => {
    if (navRef.current && !navRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex">
      {/* Botão para abrir o menu lateral */}
      <div className="bg-primary w-full h-14 fixed flex items-center z-10 justify-end">
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
          <FaUserCircle /> {currentUser}
        </div>
      </div>
      {/* Menu lateral */}
      <nav ref={navRef} className={`fixed inset-y-0 left-0 bg-primary z-50 text-white w-64 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <div className="p-4">
          <div
            className={`flex items-center justify-center gap-1 uppercase mb-4 transition-transform duration-300 ease-in-out ${isOpen ? "opacity-100 transform translate-x-0 delay-300" : "opacity-0 transform -translate-x-10"
              }`}
          >
            <FaUserCircle /> {currentUser}
          </div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.href}
                  className="flex justify-between items-center text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2" /> {item.name}
                  </div>
                </Link>
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
