import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

const abbreviateText = (text, maxLength = 8) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const Dropdown = ({ options, label, selected, onSelectedChange, openDirection = 'down', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const dropdownRef = useRef(null);
  const highlightedRef = useRef(null);
  const timeoutRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));

  const animation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? `translateY(0)` : `translateY(-10px)`,
  });

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % sortedOptions.length;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prevIndex) => {
        const newIndex = prevIndex === 0 ? sortedOptions.length - 1 : prevIndex - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      onSelectedChange(sortedOptions[highlightedIndex]);
      setIsOpen(false);
      setTypedChars(''); // Reset typedChars when an option is selected
    } else {
      const char = e.key.toLowerCase();
      const newTypedChars = typedChars + char;

      const foundIndex = sortedOptions.findIndex((option) =>
        option.toLowerCase().startsWith(newTypedChars)
      );

      if (foundIndex !== -1) {
        setHighlightedIndex(foundIndex);
      }

      timeoutRef.current = setTimeout(() => {
        setTypedChars('');
      }, 1000); // Slightly increase the timeout to 1 second for better experience

      setTypedChars(newTypedChars);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [isOpen, highlightedIndex, typedChars]);

  useEffect(() => {
    if (highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ block: 'nearest' });
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
            className={`absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg max-h-36 overflow-y-auto ${
              openDirection === 'down' ? 'mt-1 top-full' : 'mb-1 bottom-full'
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
                className={`cursor-pointer hover:bg-blue-100 py-2 px-3 text-gray-700 ${
                  index === highlightedIndex ? 'bg-blue-100' : ''
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
