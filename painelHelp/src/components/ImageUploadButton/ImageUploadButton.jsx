import React, { useRef } from 'react';

const ImageUploadButton = ({ handleImageChange }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
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
