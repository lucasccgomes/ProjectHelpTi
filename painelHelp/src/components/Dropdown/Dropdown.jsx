/*
 * Componente Dropdown
 *
 * Parâmetros:
 * - options - Uma lista de opções que serão exibidas no dropdown.
 * - label - O rótulo exibido acima do dropdown.
 * - selected - O valor atualmente selecionado no dropdown.
 * - onSelectedChange - Função chamada quando uma opção é selecionada.
 * - openDirection - Direção em que o dropdown se expande ('down' para baixo ou 'up' para cima). Default é 'down'.
 * - className - Classes CSS adicionais para estilizar o dropdown.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web'; // Importa as funções necessárias para animação

// Hook para detectar cliques fora do elemento e fechar o dropdown
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Se o clique for fora do dropdown, executa o callback para fechar
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside); // Adiciona o event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // Remove o event listener ao desmontar
    };
  }, [ref, callback]);
};

// Função para abreviar texto se exceder um determinado comprimento
const abbreviateText = (text, maxLength = 8) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text; // Abrevia se o texto for muito longo
};

// Componente Dropdown
const Dropdown = ({ options, label, selected, onSelectedChange, openDirection = 'down', className }) => {
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar se o dropdown está aberto ou fechado
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Estado para controlar o item destacado
  const [typedChars, setTypedChars] = useState(''); // Estado para armazenar os caracteres digitados pelo usuário
  const dropdownRef = useRef(null); // Referência para o dropdown
  const highlightedRef = useRef(null); // Referência para o item destacado
  const timeoutRef = useRef(null); // Referência para o timeout de reset do typedChars

  // Hook para fechar o dropdown quando o usuário clica fora do componente
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  // Ordena as opções alfabeticamente
  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));

  // Animação para abrir e fechar o dropdown
  const animation = useSpring({
    opacity: isOpen ? 1 : 0, // Controle da opacidade
    transform: isOpen ? `translateY(0)` : `translateY(-10px)`, // Controle do deslocamento vertical
  });

  // Lida com as teclas pressionadas pelo usuário (navegação, seleção e digitação)
  const handleKeyDown = (e) => {
    if (!isOpen) return; // Ignora teclas se o dropdown estiver fechado

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current); // Limpa o timeout existente
    }

    if (e.key === 'ArrowDown') {
      // Desce a seleção no dropdown
      setHighlightedIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % sortedOptions.length;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      // Sobe a seleção no dropdown
      setHighlightedIndex((prevIndex) => {
        const newIndex = prevIndex === 0 ? sortedOptions.length - 1 : prevIndex - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      // Seleciona o item ao pressionar Enter
      onSelectedChange(sortedOptions[highlightedIndex]);
      setIsOpen(false); // Fecha o dropdown
      setTypedChars(''); // Reseta o estado de typedChars
    } else {
      // Lida com a digitação de caracteres para busca no dropdown
      const char = e.key.toLowerCase();
      const newTypedChars = typedChars + char;

      const foundIndex = sortedOptions.findIndex((option) =>
        option.toLowerCase().startsWith(newTypedChars)
      );

      if (foundIndex !== -1) {
        setHighlightedIndex(foundIndex); // Atualiza o índice destacado
      }

      // Reseta o typedChars após 1 segundo
      timeoutRef.current = setTimeout(() => {
        setTypedChars('');
      }, 1000); // Aumenta o timeout para 1 segundo para melhorar a experiência

      setTypedChars(newTypedChars); // Atualiza o typedChars
    }
  };

  // Adiciona e remove o event listener para detectar teclas pressionadas
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown); // Adiciona o event listener quando o dropdown está aberto
    } else {
      document.removeEventListener('keydown', handleKeyDown); // Remove o event listener quando o dropdown está fechado
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown); // Remove ao desmontar o componente
      clearTimeout(timeoutRef.current); // Limpa o timeout ao desmontar
    };
  }, [isOpen, highlightedIndex, typedChars]);

  // Garante que o item destacado esteja visível
  useEffect(() => {
    if (highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ block: 'nearest' }); // Faz scroll para o item destacado
    }
  }, [highlightedIndex]);

  return (
    <div ref={dropdownRef}>
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={`w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        >
          {abbreviateText(selected || 'Selecionar')}
          <svg className="fill-current h-4 w-4 inline float-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d={openDirection === 'down' ? 'M7 10l5 5 5-5H7z' : 'M7 10l5-5 5 5H7z'} />
          </svg>
        </button>
        {isOpen && (
          <animated.ul
            style={animation}
            className={`absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-36 overflow-y-auto ${openDirection === 'down' ? 'mt-1 top-full' : 'mb-1 bottom-full'
              }`}
          >
            {sortedOptions.map((option, index) => (
              <li
                ref={index === highlightedIndex ? highlightedRef : null}
                key={option}
                onClick={() => {
                  onSelectedChange(option);
                  setIsOpen(false);
                  setTypedChars(''); // Reset typedChars on option select
                }}
                className={`cursor-pointer hover:bg-blue-100 py-2 px-3 text-gray-700 ${index === highlightedIndex ? 'bg-blue-100' : ''
                  }`}
              >
                {option}
              </li>
            ))}
          </animated.ul>
        )}
      </div>
    </div>
  );
};

export default Dropdown;
