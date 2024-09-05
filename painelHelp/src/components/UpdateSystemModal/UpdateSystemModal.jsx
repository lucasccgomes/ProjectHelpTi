import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const UpdateSystemModal = ({ countdown }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Nova versão disponível!</h2>
        <p className="mb-4">Atualizando em {countdown} segundos...</p>
        {/* Remover o botão de fechamento */}
        <div className="text-gray-600">
          <p>O aplicativo será atualizado automaticamente.</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

UpdateSystemModal.propTypes = {
  countdown: PropTypes.number.isRequired,
};

export default UpdateSystemModal;
