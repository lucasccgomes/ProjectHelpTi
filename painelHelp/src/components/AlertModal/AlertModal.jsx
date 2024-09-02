/*
 * AlertModal Component
 *
 * Parâmetros (props):
 * - isOpen (boolean): Controla se o modal está aberto ou fechado.
 * - onRequestClose (function): Função chamada quando o modal é fechado.
 * - title (string): Título exibido no modal.
 * - message (string): Mensagem de alerta exibida no modal.
 * - showOkButton (boolean, opcional): Controla se o botão "OK" deve ser exibido. Padrão é true.
 * - loading (boolean, opcional): Exibe uma mensagem de "Enviando solicitação..." se verdadeiro. Padrão é false.
 */

import React from 'react';
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import { IoClose } from "react-icons/io5";

// Componente AlertModal que exibe um modal de alerta
const AlertModal = ({ isOpen, onRequestClose, title, message, showOkButton = true, loading = false }) => {
    // Configurações de transição para animações ao abrir e fechar o modal
    const transitions = useTransition(isOpen, {
        from: { opacity: 0, transform: 'translateY(-50%)' }, // Estado inicial da transição (invisível e deslocado para cima)
        enter: { opacity: 1, transform: 'translateY(0%)' }, // Estado final da transição (visível e na posição correta)
        leave: { opacity: 0, transform: 'translateY(-50%)' }, // Estado ao sair da transição (invisível e deslocado para cima)
    });

    // Renderização do modal com as animações de transição
    return transitions(
        (styles, item) =>
            item && (
                <Modal
                    isOpen={isOpen}
                    onRequestClose={onRequestClose}
                    className="modal"
                    overlayClassName="overlay"
                    style={{
                        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                        content: { transition: 'opacity 0.3s ease-in-out' },
                    }}
                >
                    <animated.div style={styles}>

                        <div className='p-4 bg-white border border-gray-300 rounded-xl shadow-lg '>
                            <div className='flex justify-between mb-1'>
                                <h2 className="text-xl font-bold mb-4">{title}</h2>
                                <button
                                    onClick={onRequestClose}
                                    className='bg-red-600 text-white p-2 rounded-full h-7 w-7 flex justify-center items-center shadow-xl'
                                >
                                    <IoClose className='' />
                                </button>
                            </div>
                            <p>{message}</p>
                            {showOkButton && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={onRequestClose}
                                        className="bg-primaryBlueDark text-white p-2 rounded hover:bg-primary focus:outline-none focus:ring focus:ring-green-200"
                                    >
                                        OK
                                    </button>
                                </div>
                            )}
                            {loading && (
                                <div className="mt-4 text-blue-500">Enviando solicitação...</div>
                            )}
                        </div>
                    </animated.div>
                </Modal>
            )
    );
};

export default AlertModal;
