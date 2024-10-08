import React, { useState } from "react";
import CadastroEstoque from "../components/CadastroEstoque/CadastroEstoque";
import EstoqueViewer from "../components/EstoqueViewer/EstoqueViewer";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';


const Estoque = () => {
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
      <div className="hidden lg:flex">
        <CadastroEstoque />
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
        <EstoqueViewer />
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
                <CadastroEstoque />
              </div>
            </animated.div>
          </Modal>
        )
      )}
    </div>
  );
};

export default Estoque;
