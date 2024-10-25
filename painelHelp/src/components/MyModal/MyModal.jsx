/*
 * MyModal Component
 *
 * Parâmetros (props):
 * - isOpen (boolean): Controla se o modal está aberto ou fechado.
 * - onClose (function): Função chamada para fechar o modal.
 * - children (node): Conteúdo a ser exibido dentro do modal.
 * - showCloseButton (boolean, opcional): Controla se o botão de fechar (X) deve ser exibido. Padrão é true.
 */

import React from 'react';
import { useTransition, animated } from '@react-spring/web';

const MyModal = ({ isOpen, onClose, children, showCloseButton = true }) => {
  // Configura a transição do modal usando o hook useTransition do react-spring
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scaleY(0) translateY(-50%)' }, // Estilo inicial da animação (invisível e encolhido)
    enter: { opacity: 1, transform: 'scaleY(1) translateY(0%)' },  // Estilo ao entrar na tela (visível e em tamanho normal)
    leave: { opacity: 0, transform: 'scaleY(0) translateY(50%)' }, // Estilo ao sair da tela (invisível e encolhido)
    config: { tension: 500, friction: 30, clamp: true, duration: 150 }, // Configuração da animação (velocidade e suavidade)
  });

  // Renderiza o modal condicionalmente, dependendo do estado isOpen

  return transitions(
    (styles, item) =>
      item && (
        <div className="fixed inset-0 z-50 overflow-auto bg-smoke-light bg-black/[.6] flex">
          <animated.div style={styles} className="relative px-6 pb-3 pt-1 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            {showCloseButton && (
              <span
                onClick={onClose}
                className="cursor-pointer absolute top-0 w-10 flex justify-center items-center h-10 right-0 p-4 bg-red-600 rounded-full m-2"
              >
                <button className="text-white font-bold">X</button>
              </span>
            )}
            {children}
          </animated.div>
        </div>
      )
  );
};

export default MyModal;
