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

const Dropdown = ({ options, label, selected, onSelectedChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const animation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? `translateY(0)` : `translateY(-10px)`,
  });

  return (
    <div ref={dropdownRef}>
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {selected}
          <svg className="fill-current h-4 w-4 inline float-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
        {isOpen && (
          <animated.ul style={animation} className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-36 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => {
                  onSelectedChange(option);
                  setIsOpen(false);
                }}
                className="cursor-pointer hover:bg-blue-100 py-2 px-3 text-gray-700"
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
