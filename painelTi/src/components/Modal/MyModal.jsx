import React from 'react';
import { useSpring, animated } from '@react-spring/web';

const MyModal = ({ isOpen, onClose, children }) => {
  const animation = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-smoke-light bg-black/[.6] flex">
      <animated.div style={animation} className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
        <span onClick={onClose} className="cursor-pointer absolute top-0 w-10 flex justify-center items-center h-10 right-0 p-4 b bg-red-600 rounded-full m-2">
          <button className='text-white font-bold'>X</button>
        </span>
        {children}
      </animated.div>
    </div>
  );
};

export default MyModal;
