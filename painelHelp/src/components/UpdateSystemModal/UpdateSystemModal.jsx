import React from 'react';
import ReactDOM from 'react-dom';

const UpdateModal = ({ onUpdate, onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Atualização Disponível</h2>
        <p className="mb-4">Uma nova versão está disponível. Atualize para a versão mais recente.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onUpdate}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Atualizar Agora
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdateModal;
