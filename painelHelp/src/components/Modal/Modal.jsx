import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-smoke-light flex">
      <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
        <span onClick={onClose} className="cursor-pointer absolute top-0 w-10 flex justify-center items-center h-10 right-0 p-4 b bg-red-600 rounded-full m-2">
          <button className='text-white font-bold' >X</button>
        </span>
        {children}
      </div>

    </div>
  );
};

export default Modal;
