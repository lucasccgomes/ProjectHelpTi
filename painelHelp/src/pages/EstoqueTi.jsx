import React, { useState } from "react";
import CadastroEstoqueTi from "../components/CadastroEstoqueTi/CadastroEstoqueTi";
import EstoqueViewerTi from "../components/EstoqueViewerTi/EstoqueViewerTi";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';


const EstoqueTi = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const transitions = useTransition(isModalOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  return (
    <div className="flex-col min-h-screen flex lg:flex-row items-center lg:justify-between justify-center bg-primary text-gray-900 p-4">
      <div className="hidden mt-11 lg:flex">
        <CadastroEstoqueTi />
      </div>
      <div className="lg:hidden w-full pt-8">
        <div className=" p-2 rounded-xl">
          <button
            type="button"
            onClick={openModal}
            className="w-full shadow-xl border border-gray-500 font-semibold flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
          >
            <p>Cadastro de Novo Item</p>
          </button>
        </div>
      </div>
      <div className="mt-4">
        <EstoqueViewerTi />
      </div>
      {transitions(
        (styles, item) => item && (
          <Modal isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            className="modal flex items-center justify-center"
            overlayClassName="overlay"
            style={{
              overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
              content: { transition: 'opacity 0.3s ease-in-out' }
            }}>
            <animated.div style={styles}>
              <div>
                <CadastroEstoqueTi />
              </div>
            </animated.div>
          </Modal>
        )
      )}
    </div>
  );
};

export default EstoqueTi;
