import React from 'react';
import { useTransition, animated } from '@react-spring/web';

const MyModal = ({ isOpen, onClose, children }) => {
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  return transitions(
    (styles, item) =>
      item && (
        <div className="fixed inset-0 z-50 overflow-auto bg-smoke-light bg-black/[.6] flex">
          <animated.div style={styles} className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <span
              onClick={onClose}
              className="cursor-pointer absolute top-0 w-10 flex justify-center items-center h-10 right-0 p-4 bg-red-600 rounded-full m-2"
            >
              <button className="text-white font-bold">X</button>
            </span>
            {children}
          </animated.div>
        </div>
      )
  );
};

export default MyModal;
