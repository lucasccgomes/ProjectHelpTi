import React, { useRef } from 'react';

// Componente para upload de imagens
const ImageUploadButton = ({ handleImageChange }) => {
  const fileInputRef = useRef(null); // Cria uma referência para o input de arquivo

  // Função para abrir o seletor de arquivos quando o botão é clicado
  const handleClick = () => {
    fileInputRef.current.click(); // Simula um clique no input de arquivo oculto
  };

  return (
    <div className='w-full'>
      <button
        type="button"
        onClick={handleClick}
        className="bg-primaryBlueDark hover:bg-primaryOpaci w-full text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
      >
        Selecionar Imagens
      </button>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        ref={fileInputRef}
        className="hidden" // Esconde o input real
      />
    </div>
  );
};

export default ImageUploadButton;
